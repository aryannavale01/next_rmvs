'use client';

import { ReactNode } from 'react';
import { motion } from 'motion/react';

interface ScrollAnimateProps {
  children: ReactNode;
  variant?: 'fadeIn' | 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scaleUp' | 'stagger';
  delay?: number;
  duration?: number;
  className?: string;
  id?: string;
  once?: boolean;
  amount?: 'some' | 'all' | number;
  key?: string | number;
  onClick?: any;
}

export default function ScrollAnimate({
  children,
  variant = 'fadeInUp',
  delay = 0,
  duration = 0.6,
  className = '',
  id,
  once = true,
  amount = 0.1,
  onClick,
}: ScrollAnimateProps) {
  const variants = {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    fadeInUp: {
      hidden: { opacity: 0, y: 30 },
      visible: { opacity: 1, y: 0 },
    },
    fadeInLeft: {
      hidden: { opacity: 0, x: -35 },
      visible: { opacity: 1, x: 0 },
    },
    fadeInRight: {
      hidden: { opacity: 0, x: 35 },
      visible: { opacity: 1, x: 0 },
    },
    scaleUp: {
      hidden: { opacity: 0, scale: 0.96 },
      visible: { opacity: 1, scale: 1 },
    },
    stagger: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.12,
          delayChildren: delay,
        },
      },
    },
  };

  const itemTransition = {
    type: 'spring' as const,
    stiffness: 80,
    damping: 18,
    mass: 1,
    duration,
    delay,
    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
  };

  return (
    <motion.div
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={variants[variant]}
      transition={variant === 'stagger' ? undefined : itemTransition}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  variant?: 'fadeIn' | 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scaleUp';
  className?: string;
  id?: string;
  onClick?: any;
}

export function StaggerItem({
  children,
  className = '',
  variant = 'fadeInUp',
  id,
  onClick,
}: StaggerItemProps) {
  const itemVariants = {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { ease: [0.16, 1, 0.3, 1] as [number, number, number, number], duration: 0.5 } },
    },
    fadeInUp: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 90, damping: 15, duration: 0.5 } },
    },
    fadeInLeft: {
      hidden: { opacity: 0, x: -20 },
      visible: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 90, damping: 15, duration: 0.5 } },
    },
    fadeInRight: {
      hidden: { opacity: 0, x: 20 },
      visible: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 90, damping: 15, duration: 0.5 } },
    },
    scaleUp: {
      hidden: { opacity: 0, scale: 0.96 },
      visible: { opacity: 1, scale: 1, transition: { ease: [0.16, 1, 0.3, 1] as [number, number, number, number], duration: 0.5 } },
    },
  };

  return (
    <motion.div id={id} variants={itemVariants[variant]} className={className} onClick={onClick}>
      {children}
    </motion.div>
  );
}
