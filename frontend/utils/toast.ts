import { toast } from 'react-toastify';

const showToast = (
  message: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'info',
): void => {
  switch (type) {
    case 'success':
      toast.success(message);
      break;
    case 'error':
      toast.error(message);
      break;
    case 'warning':
      toast.warning(message);
      break;
    default:
      toast.info(message);
      break;
  }
};

export default showToast;

export { ToastContainer } from 'react-toastify';