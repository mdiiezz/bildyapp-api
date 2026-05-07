import Company from '../models/Company.js';
import RefreshToken from '../models/RefreshToken.js';
import User from '../models/User.js';
import { notificationService } from '../services/notification.service.js';
import { mailService } from '../services/mail.service.js';
import { AppError } from '../utils/AppError.js';
import { compare, encrypt } from '../utils/handlePassword.js';
import {
  createSixDigitCode,
  generateRefreshToken,
  getRefreshTokenExpiry,
  signAccessToken
} from '../utils/handleJwt.js';
import { config } from '../config/index.js';

const createRefreshTokenForUser = async (user, req) => {
  const token = generateRefreshToken();
  await RefreshToken.create({
    token,
    user: user._id,
    expiresAt: getRefreshTokenExpiry(),
    createdByIp: req.ip
  });
  return token;
};

const buildAuthResponse = async (user, req) => ({
  user,
  accessToken: signAccessToken(user),
  refreshToken: await createRefreshTokenForUser(user, req)
});

export const registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email, deleted: { $ne: true } });
    if (existingUser) {
      throw AppError.conflict('Ya existe un usuario registrado con ese email', 'EMAIL_ALREADY_EXISTS');
    }

    const user = await User.create({
      email,
      password: await encrypt(password),
      role: 'admin',
      status: 'pending',
      verificationCode: createSixDigitCode(),
      verificationAttempts: 3
    });

    await mailService.sendVerificationCode(user);
    notificationService.emit('user:registered', user);

    res.status(201).json({
      data: await buildAuthResponse(user, req)
    });
  } catch (error) {
    next(error);
  }
};

export const validateEmail = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+verificationCode +verificationAttempts');

    if (!user) throw AppError.notFound('Usuario');
    if (user.status === 'verified') {
      return res.json({ message: 'El usuario ya estaba verificado' });
    }

    if (user.verificationAttempts <= 0) {
      throw AppError.tooManyRequests('Has agotado los intentos de validación', 'VALIDATION_ATTEMPTS_EXHAUSTED');
    }

    if (user.verificationCode !== req.body.code) {
      user.verificationAttempts -= 1;
      await user.save();

      if (user.verificationAttempts <= 0) {
        throw AppError.tooManyRequests('Código incorrecto. Has agotado los intentos.', 'VALIDATION_ATTEMPTS_EXHAUSTED');
      }

      throw AppError.badRequest(`Código incorrecto. Intentos restantes: ${user.verificationAttempts}`, 'INVALID_VERIFICATION_CODE');
    }

    user.status = 'verified';
    user.verificationCode = undefined;
    user.verificationAttempts = 0;
    await user.save();

    notificationService.emit('user:verified', user);

    res.json({ message: 'Email validado correctamente' });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, deleted: { $ne: true } }).select('+password');

    if (!user) throw AppError.unauthorized('Credenciales incorrectas', 'INVALID_CREDENTIALS');

    const validPassword = await compare(password, user.password);
    if (!validPassword) throw AppError.unauthorized('Credenciales incorrectas', 'INVALID_CREDENTIALS');

    res.json({ data: await buildAuthResponse(user, req) });
  } catch (error) {
    next(error);
  }
};

export const updatePersonalData = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ data: user });
  } catch (error) {
    next(error);
  }
};

export const updateCompanyData = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw AppError.notFound('Usuario');

    const { isFreelance } = req.body;
    let companyData;

    if (isFreelance) {
      if (!user.nif || !user.name) {
        throw AppError.badRequest('Para crear una compañía de autónomo primero debes completar tus datos personales', 'PERSONAL_DATA_REQUIRED');
      }

      companyData = {
        name: `${user.name} ${user.lastName || ''}`.trim(),
        cif: user.nif,
        address: user.address,
        isFreelance: true
      };
    } else {
      companyData = req.body;
    }

    let company = await Company.findOne({ cif: companyData.cif, deleted: { $ne: true } });

    if (!company) {
      company = await Company.create({
        owner: user._id,
        name: companyData.name,
        cif: companyData.cif,
        address: companyData.address,
        isFreelance: companyData.isFreelance
      });
      user.role = 'admin';
    } else if (!company.owner.equals(user._id)) {
      user.role = 'guest';
    }

    user.company = company._id;
    await user.save();
    await user.populate('company');

    res.json({ data: user });
  } catch (error) {
    next(error);
  }
};

export const uploadCompanyLogo = async (req, res, next) => {
  try {
    if (!req.file) throw AppError.badRequest('Debes subir una imagen en el campo logo', 'LOGO_REQUIRED');
    if (!req.user.company) throw AppError.badRequest('El usuario no tiene compañía asociada', 'COMPANY_REQUIRED');

    const logoUrl = `${config.publicUrl}/uploads/${req.file.filename}`;
    const company = await Company.findByIdAndUpdate(
      req.user.company,
      { logo: logoUrl },
      { new: true }
    );

    res.json({ data: company });
  } catch (error) {
    next(error);
  }
};

export const getAuthenticatedUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('company');
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
};

export const refreshAccessToken = async (req, res, next) => {
  try {
    const storedToken = await RefreshToken.findOne({ token: req.body.refreshToken }).populate('user');

    if (!storedToken || !storedToken.isActive() || storedToken.user.deleted) {
      throw AppError.unauthorized('Refresh token inválido o expirado', 'INVALID_REFRESH_TOKEN');
    }

    res.json({ data: { accessToken: signAccessToken(storedToken.user) } });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await RefreshToken.findOneAndUpdate(
        { token: refreshToken, user: req.user._id },
        { revokedAt: new Date(), revokedByIp: req.ip }
      );
    } else {
      await RefreshToken.updateMany(
        { user: req.user._id, revokedAt: null },
        { revokedAt: new Date(), revokedByIp: req.ip }
      );
    }

    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const soft = req.query.soft === 'true';

    if (soft) {
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { deleted: true, deletedAt: new Date() },
        { new: true }
      );
      await RefreshToken.updateMany({ user: req.user._id, revokedAt: null }, { revokedAt: new Date() });
      notificationService.emit('user:deleted', user);
      return res.json({ message: 'Usuario eliminado mediante soft delete', data: user });
    }

    const user = await User.findByIdAndDelete(req.user._id);
    await RefreshToken.deleteMany({ user: req.user._id });
    notificationService.emit('user:deleted', user);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!user) throw AppError.notFound('Usuario');

    const validPassword = await compare(req.body.currentPassword, user.password);
    if (!validPassword) throw AppError.unauthorized('La contraseña actual no es correcta', 'INVALID_CURRENT_PASSWORD');

    user.password = await encrypt(req.body.newPassword);
    await user.save();

    await RefreshToken.updateMany({ user: user._id, revokedAt: null }, { revokedAt: new Date() });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    next(error);
  }
};

export const inviteUser = async (req, res, next) => {
  try {
    if (!req.user.company) {
      throw AppError.badRequest('Para invitar usuarios debes tener una compañía asociada', 'COMPANY_REQUIRED');
    }

    const existingUser = await User.findOne({ email: req.body.email, deleted: { $ne: true } });
    if (existingUser) throw AppError.conflict('Ya existe un usuario con ese email', 'EMAIL_ALREADY_EXISTS');

    const invitedUser = await User.create({
      email: req.body.email,
      password: await encrypt(req.body.password),
      name: req.body.name,
      lastName: req.body.lastName,
      nif: req.body.nif,
      role: 'guest',
      status: 'pending',
      verificationCode: createSixDigitCode(),
      verificationAttempts: 3,
      company: req.user.company
    });

    await mailService.sendVerificationCode(invitedUser);
    notificationService.emit('user:invited', { invitedUser, invitedBy: req.user });

    res.status(201).json({ data: invitedUser });
  } catch (error) {
    next(error);
  }
};
