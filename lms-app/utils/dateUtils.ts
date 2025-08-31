export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const calculateDaysLeft = (dueDate: string): number => {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isOverdue = (dueDate: string): boolean => {
  return calculateDaysLeft(dueDate) < 0;
};

export const isDueSoon = (dueDate: string, threshold: number = 3): boolean => {
  const daysLeft = calculateDaysLeft(dueDate);
  return daysLeft >= 0 && daysLeft <= threshold;
};