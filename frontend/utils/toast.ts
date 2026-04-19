import { toast } from 'react-toastify';

const defaultToastOptions = {
  position: 'top-right' as const,
  hideProgressBar: true,
};

const showToast = (
  message: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'info',
): void => {
  switch (type) {
    case 'success':
      toast.success(message, defaultToastOptions);
      break;
    case 'error':
      toast.error(message, defaultToastOptions);
      break;
    case 'warning':
      toast.warning(message, defaultToastOptions);
      break;
    default:
      toast.info(message, defaultToastOptions);
      break;
  }
};

export default showToast;
