import React, { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { motion } from "framer-motion";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  total: number;
  onCashCheckout: (amount: number) => void;
  onMpesaCheckout: (phone: string) => void;
  onMpesaManual: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ open, onClose, total, onCashCheckout, onMpesaCheckout, onMpesaManual }) => {
  const [step, setStep] = useState<"options" | "cash" | "mpesa">("options");
  const [cashAmount, setCashAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [change, setChange] = useState<number | null>(null);

  const handleCash = () => {
    const amt = parseFloat(cashAmount);
    if (isNaN(amt) || amt < total) return;
    setChange(amt - total);
    onCashCheckout(amt);
  };

  const handleMpesa = () => {
    if (!phone.match(/^\d{10,}$/)) return;
    onMpesaCheckout(phone);
  };

  return (
    <Transition show={open} as={React.Fragment}>
      <Dialog className="fixed inset-0 z-50 flex items-center justify-center" onClose={onClose}>
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md z-50 relative"
        >
          <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" onClick={onClose}>✕</button>
          {step === "options" && (
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-bold mb-2">Choose Payment Method</h2>
              <button className="bg-blue-500 text-white rounded-xl py-3 font-bold" onClick={() => setStep("cash")}>Cash</button>
              <button className="bg-green-500 text-white rounded-xl py-3 font-bold" onClick={() => setStep("mpesa")}>M-Pesa</button>
            </div>
          )}
          {step === "cash" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold">Cash Payment</h2>
              <input
                type="number"
                placeholder="Amount received"
                value={cashAmount}
                onChange={e => setCashAmount(e.target.value)}
                className="border rounded px-3 py-2"
              />
              <button
                className="bg-blue-500 text-white rounded-xl py-2 font-bold"
                onClick={handleCash}
                disabled={parseFloat(cashAmount) < total}
              >
                Complete Sale
              </button>
              {change !== null && (
                <div className="text-green-600 font-bold">Change: {change.toFixed(2)}</div>
              )}
            </div>
          )}
          {step === "mpesa" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold">M-Pesa Payment</h2>
              <input
                type="text"
                placeholder="Customer Phone Number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="border rounded px-3 py-2"
              />
              <button
                className="bg-green-500 text-white rounded-xl py-2 font-bold"
                onClick={handleMpesa}
                disabled={!phone.match(/^\d{10,}$/)}
              >
                Send STK Push
              </button>
              <button
                className="bg-gray-500 text-white rounded-xl py-2 font-bold"
                onClick={onMpesaManual}
              >
                Paid via Manual Till
              </button>
            </div>
          )}
        </motion.div>
      </Dialog>
    </Transition>
  );
};

export default CheckoutModal;
