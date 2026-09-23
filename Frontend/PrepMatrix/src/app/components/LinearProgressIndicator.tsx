import { motion, useReducedMotion } from 'motion/react';

interface LinearProgressIndicatorProps {
  className?: string;
  widthClass?: string;
}

export function LinearProgressIndicator({
  className = '',
  widthClass = 'w-56',
}: LinearProgressIndicatorProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      role="progressbar"
      aria-label="Loading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      className={`relative h-[2px] overflow-hidden rounded-full bg-[#263449] ${widthClass} ${className}`.trim()}
    >
      {shouldReduceMotion ? (
        <div className="h-full w-1/3 rounded-full bg-[#6D5EF9]" />
      ) : (
        <motion.div
          className="h-full w-24 rounded-full bg-[#6D5EF9]"
          initial={{ x: '-100%' }}
          animate={{ x: '250%' }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: [0.4, 0, 0.2, 1],
          }}
        />
      )}
    </div>
  );
}
