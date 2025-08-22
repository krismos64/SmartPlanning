import React from 'react';
import { CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BillingMenuItemProps {
  className?: string;
  onClick?: () => void;
}

const BillingMenuItem: React.FC<BillingMenuItemProps> = ({ 
  className = '', 
  onClick 
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/dashboard/billing');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors hover:bg-gray-100 ${className}`}
      title="Gérer mon abonnement"
    >
      <CreditCard size={20} className="text-gray-600" />
      <span className="text-gray-700 font-medium">Facturation</span>
    </button>
  );
};

export default BillingMenuItem;