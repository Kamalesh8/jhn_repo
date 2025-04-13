interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact?: string;
  };
  notes: {
    [key: string]: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    animation?: boolean;
  };
  retry?: {
    enabled?: boolean;
    max_count?: number;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  on: (event: string, callback: Function) => void;
  open: () => void;
  close: () => void;
}

declare class Razorpay {
  constructor(options: RazorpayOptions);
  open: () => void;
  close: () => void;
  on: (event: string, callback: Function) => void;
}

interface Window {
  Razorpay: typeof Razorpay;
}
