import Lottie, { LottieComponentProps } from "lottie-react";
import React from "react";

interface EnhancedLottieProps extends LottieComponentProps {
  alt?: string;
}

const EnhancedLottie: React.FC<EnhancedLottieProps> = ({ alt, ...props }) => {
  return (
    <div role={alt ? "img" : undefined} aria-label={alt}>
      <Lottie {...props} />
    </div>
  );
};

export default EnhancedLottie;
