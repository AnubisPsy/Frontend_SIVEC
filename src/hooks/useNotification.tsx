// src/hooks/useNotification.ts
import { toast, ToastOptions } from "react-toastify";

interface NotificationOptions {
  title?: string;
  message: string;
  duration?: number;
}

export const useNotification = () => {
  const defaultOptions: ToastOptions = {
    position: "top-right",
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  };

  const success = ({
    title,
    message,
    duration = 3000,
  }: NotificationOptions) => {
    toast.success(
      <div>
        {title && <div className="font-semibold mb-1">{title}</div>}
        <div className="text-sm">{message}</div>
      </div>,
      {
        ...defaultOptions,
        autoClose: duration,
      }
    );
  };

  const error = ({ title, message, duration = 4000 }: NotificationOptions) => {
    toast.error(
      <div>
        {title && <div className="font-semibold mb-1">{title}</div>}
        <div className="text-sm">{message}</div>
      </div>,
      {
        ...defaultOptions,
        autoClose: duration,
      }
    );
  };

  const warning = ({
    title,
    message,
    duration = 4000,
  }: NotificationOptions) => {
    toast.warning(
      <div>
        {title && <div className="font-semibold mb-1">{title}</div>}
        <div className="text-sm">{message}</div>
      </div>,
      {
        ...defaultOptions,
        autoClose: duration,
      }
    );
  };

  const info = ({ title, message, duration = 3000 }: NotificationOptions) => {
    toast.info(
      <div>
        {title && <div className="font-semibold mb-1">{title}</div>}
        <div className="text-sm">{message}</div>
      </div>,
      {
        ...defaultOptions,
        autoClose: duration,
      }
    );
  };

  return {
    success,
    error,
    warning,
    info,
  };
};
