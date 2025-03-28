
import React, { useState } from "react";
import { Check, X } from "lucide-react";

interface SuccessBannerProps {
  title: string;
  description: string;
  actionText: string;
  onAction: () => void;
}

const SuccessBanner = ({ title, description, actionText, onAction }: SuccessBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-[#E0F6E8] border-l-4 border-[#4CAF50] text-[#3F2A51] py-2 px-4 mb-3 rounded flex items-center justify-between">
      <div className="flex items-center">
        <div className="bg-[#4CAF50] p-1 rounded-full mr-3">
          <Check className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center">
          <span className="font-bold text-sm mr-2">{title}</span>
          <span className="text-sm">{description}</span>
        </div>
      </div>
      <div className="flex items-center">
        <button 
          className="bg-white hover:bg-[#F8F6FE] text-[#3F2A51] text-xs py-1 px-3 rounded border border-[#E2DCF8] mr-2"
          onClick={onAction}
        >
          {actionText}
        </button>
        <button 
          className="hover:bg-[#D5EEDE] p-1 rounded-full"
          onClick={() => setIsVisible(false)}
          aria-label="Close"
        >
          <X className="h-4 w-4 text-[#3F2A51]" />
        </button>
      </div>
    </div>
  );
};

export default SuccessBanner;
