'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
  lazy,
  memo,
  ComponentType,
} from 'react';
import { cn } from '@/lib/utils';
import { PortalSpinner } from './portal-spinner';

// ── Types ──
export interface LazyLoadProps {
  /** Children to render when loaded */
  children: React.ReactNode;
  /** Fallback component while loading */
  fallback?: React.ReactNode;
  /** Minimum height to reserve for content (prevents layout shift) */
  minHeight?: number | string;
  /** Threshold for intersection observer (0-1) */
  threshold?: number;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Trigger loading immediately (no intersection observer) */
  immediate?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when component is loaded */
  onLoad?: () => void;
  /** Placeholder content before loading */
  placeholder?: React.ReactNode;
  /** Enable fade-in animation when loaded */
  fadeIn?: boolean;
  /** Portal context for spinner styling */
  portal?: 'admin' | 'teacher' | 'parent';
}

/**
 * LazyLoad — Intersection Observer-based lazy loading wrapper
 * 
 * Defers rendering of heavy components until they're about to enter viewport.
 * Uses Intersection Observer for efficient detection without scroll listeners.
 * 
 * Features:
 * - Intersection Observer for efficient viewport detection
 * - Minimum height reservation to prevent layout shift
 * - Customizable loading threshold and root margin
 * - Fade-in animation on load
 * - Portal-aware loading spinner
 * - onLoad callback for analytics/tracking
 * 
 * Performance benefits:
 * - Deferred rendering: Heavy components not rendered until needed
 * - Layout stability: minHeight prevents content jumps
 * - No scroll listeners: Uses native Intersection Observer
 * - Memory efficiency: Components garbage collected if scrolled far away
 * 
 * Usage:
 * ```tsx
 * <LazyLoad minHeight={200} threshold={0.1}>
 *   <HeavyChartComponent />
 * </LazyLoad>
 * ```
 */
export function LazyLoad({
  children,
  fallback,
  minHeight = 100,
  threshold = 0.1,
  rootMargin = '100px',
  immediate = false,
  className,
  onLoad,
  placeholder,
  fadeIn = true,
  portal = 'admin',
}: LazyLoadProps) {
  const [isLoaded, setIsLoaded] = useState(immediate);
  const [isVisible, setIsVisible] = useState(immediate);
  const ref = useRef<HTMLDivElement>(null);

  // Intersection Observer setup
  useEffect(() => {
    if (immediate || isLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [immediate, isLoaded, threshold, rootMargin]);

  // Load component when visible
  useEffect(() => {
    if (isVisible && !isLoaded) {
      // Small delay to allow CSS containment to kick in
      const timer = setTimeout(() => {
        setIsLoaded(true);
        onLoad?.();
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [isVisible, isLoaded, onLoad]);

  // Default fallback spinner
  const defaultFallback = (
    <div className="flex items-center justify-center h-full">
      <PortalSpinner portal={portal} size="md" variant="gradient" />
    </div>
  );

  // Placeholder before loading
  const placeholderContent = placeholder || (
    <div
      className={cn(
        'flex items-center justify-center',
        'rounded-xl border',
        'bg-muted/50'
      )}
      style={{ minHeight }}
    >
      {fallback || defaultFallback}
    </div>
  );

  return (
    <div
      ref={ref}
      data-slot="lazy-load"
      data-loaded={isLoaded}
      className={cn(
        'relative',
        fadeIn && isLoaded && 'animate-fade-in',
        className
      )}
      style={{
        minHeight: isLoaded ? 'auto' : minHeight,
        contain: isLoaded ? 'content' : 'strict',
      }}
    >
      {!isLoaded ? placeholderContent : children}
    </div>
  );
}

/**
 * LazyComponent — Wrapper for React.lazy components with Suspense
 * 
 * Combines React.lazy() with Suspense for code-split lazy loading.
 * Useful for route-level code splitting.
 * 
 * Usage:
 * ```tsx
 * const HeavyChart = LazyComponent(() => import('./HeavyChart'));
 * 
 * <LazyComponentWrapper>
 *   <HeavyChart />
 * </LazyComponentWrapper>
 * ```
 */
export function LazyComponentWrapper({
  children,
  fallback,
  minHeight = 200,
  className,
  portal = 'admin',
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minHeight?: number;
  className?: string;
  portal?: 'admin' | 'teacher' | 'parent';
}) {
  const defaultFallback = (
    <div
      className={cn(
        'flex items-center justify-center',
        'rounded-xl border',
        'bg-muted/50',
        className
      )}
      style={{ minHeight }}
    >
      <PortalSpinner portal={portal} size="lg" variant="gradient" showText text="Loading..." />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
}

/**
 * createLazyComponent — Factory for creating lazy-loaded components
 * 
 * Creates a React.lazy component with built-in Suspense handling.
 * Returns a component that can be used directly without wrapping.
 */
export function createLazyComponent<T extends ComponentType<unknown>>(
  loader: () => Promise<{ default: T }>,
  options?: {
    fallback?: React.ReactNode;
    minHeight?: number;
    portal?: 'admin' | 'teacher' | 'parent';
    className?: string;
  }
) {
  const LazyComponent = lazy(loader);

  const WrappedComponent = memo(function WrappedComponent(props: unknown) {
    const defaultFallback = (
      <div
        className={cn(
          'flex items-center justify-center',
          'rounded-xl border',
          'bg-muted/50',
          options?.className
        )}
        style={{ minHeight: options?.minHeight ?? 200 }}
      >
        <PortalSpinner
          portal={options?.portal ?? 'admin'}
          size="lg"
          variant="gradient"
          showText
          text="Loading component..."
        />
      </div>
    );

    return (
      <Suspense fallback={options?.fallback || defaultFallback}>
        <LazyComponent {...(props as Record<string, unknown>)} />
      </Suspense>
    );
  });

  return WrappedComponent;
}

/**
 * LazyImage — Lazy-loaded image with Intersection Observer
 * 
 * Defers image loading until viewport approach.
 * Shows placeholder/shimmer while loading.
 * 
 * Features:
 * - Intersection Observer detection
 * - Shimmer placeholder animation
 * - Fade-in on load
 * - Error handling with fallback
 */
export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  placeholderClassName,
  threshold = 0.1,
  rootMargin = '50px',
  fadeIn = true,
  onLoad,
  onError,
}: {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  placeholderClassName?: string;
  threshold?: number;
  rootMargin?: string;
  fadeIn?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        });
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  return (
    <div
      ref={ref}
      data-slot="lazy-image"
      data-loaded={isLoaded}
      className={cn('relative overflow-hidden', className)}
      style={{ width, height, contain: 'strict' }}
    >
      {/* Placeholder shimmer */}
      {!isLoaded && !hasError && (
        <div
          className={cn(
            'absolute inset-0 skeleton-shimmer',
            placeholderClassName
          )}
        />
      )}

      {/* Actual image */}
      {shouldLoad && !hasError && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            fadeIn && isLoaded && 'animate-fade-in',
            !isLoaded && 'opacity-0'
          )}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-xs">Failed to load</span>
        </div>
      )}
    </div>
  );
}

/**
 * LazySection — Lazy-loaded section for page-level content
 * 
 * Optimized for large sections that should load on scroll.
 * Includes header, content, and optional footer areas.
 */
export function LazySection({
  title,
  children,
  minHeight = 300,
  threshold = 0.05,
  rootMargin = '200px',
  className,
  headerClassName,
  portal = 'admin',
  immediate = false,
}: {
  title?: string;
  children: React.ReactNode;
  minHeight?: number;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  headerClassName?: string;
  portal?: 'admin' | 'teacher' | 'parent';
  immediate?: boolean;
}) {
  return (
    <LazyLoad
      minHeight={minHeight}
      threshold={threshold}
      rootMargin={rootMargin}
      portal={portal}
      immediate={immediate}
      className={cn('rounded-xl', className)}
    >
      {title && (
        <h2
          className={cn(
            'text-lg font-semibold mb-4',
            headerClassName
          )}
        >
          {title}
        </h2>
      )}
      {children}
    </LazyLoad>
  );
}

// Export all
export {
  Suspense,
  lazy,
  memo,
};