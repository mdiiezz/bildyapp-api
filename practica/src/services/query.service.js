export const buildPagination = ({ page = 1, limit = 10 }) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit
  };
};

export const buildSort = (sort = '-createdAt') => {
  if (!sort) return { createdAt: -1 };
  const field = sort.startsWith('-') ? sort.slice(1) : sort;
  const direction = sort.startsWith('-') ? -1 : 1;
  return { [field]: direction };
};

export const paginatedResponse = (data, totalItems, page, limit) => ({
  data,
  pagination: {
    totalItems,
    totalPages: Math.ceil(totalItems / limit) || 1,
    currentPage: page,
    limit
  }
});
