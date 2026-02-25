import { useRef, useEffect, useState, ReactNode } from 'react';

interface RevealOnScrollProps {
  children: ReactNode;
  className?: string;
}

export function RevealOnScroll({
  children,
  className = '',
}: RevealOnScrollProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Anima só uma vez e para de observar (melhora a performance)
        }
      },
      { threshold: 0.15 } // Dispara quando 15% do elemento aparecer na tela
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
      } ${className}`}
    >
      {children}
    </div>
  );
}
