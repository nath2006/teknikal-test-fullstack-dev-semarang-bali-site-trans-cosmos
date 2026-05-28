import { clsx } from 'clsx';

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'ghost';
  }
) {
  const { className, variant = 'primary', ...rest } = props;

  return (
    <button
      className={clsx(
        'cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition',
        variant === 'primary'
          ? 'bg-black text-white hover:bg-gray-700'
          : 'bg-white text-slate-700 hover:bg-slate-100',
        className
      )}
      {...rest}
    />
  );
}
