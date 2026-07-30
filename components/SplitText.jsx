import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const SplitText = ({
  text,
  className = '',
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'left',
  tag = 'p',
  onLetterAnimationComplete
}) => {
  const ref = useRef(null);
  const animationCompletedRef = useRef(false);
  const onCompleteRef = useRef(onLetterAnimationComplete);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  useEffect(() => {
    if (document.fonts.status === 'loaded') {
      setFontsLoaded(true);
    } else {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
      });
    }
  }, []);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded) return;
      if (animationCompletedRef.current) return;
      const el = ref.current;

      const targets = el.querySelectorAll('.split-char, .split-word');
      if (!targets.length) return;

      gsap.fromTo(
        targets,
        { ...from },
        {
          ...to,
          duration,
          ease,
          stagger: delay / 1000,
          scrollTrigger: {
            trigger: el,
            start: `top ${100 - threshold * 100}%`,
            once: true
          },
          onComplete: () => {
            animationCompletedRef.current = true;
            onCompleteRef.current?.();
          }
        }
      );
    },
    {
      dependencies: [text, delay, duration, ease, splitType, threshold, rootMargin, fontsLoaded],
      scope: ref
    }
  );

  const Tag = tag || 'p';

  // Manual split helper for fallback rendering
  const renderSplitContent = () => {
    if (splitType === 'words') {
      return text.split(' ').map((word, i) => (
        <span key={i} className="split-word" style={{ display: 'inline-block', whiteSpace: 'pre' }}>
          {word}{i < text.split(' ').length - 1 ? ' ' : ''}
        </span>
      ));
    }
    return text.split('').map((char, i) => (
      <span key={i} className="split-char" style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : 'normal' }}>
        {char}
      </span>
    ));
  };

  return (
    <Tag
      ref={ref}
      style={{
        textAlign,
        overflow: 'hidden',
        display: 'inline-block',
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        willChange: 'transform, opacity'
      }}
      className={`split-parent ${className}`}
    >
      {renderSplitContent()}
    </Tag>
  );
};

export default SplitText;
