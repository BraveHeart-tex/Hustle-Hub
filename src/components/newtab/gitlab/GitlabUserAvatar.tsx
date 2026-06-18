import { cn } from '@/lib/utils';

interface GitlabUserAvatar
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
}

export const GitlabUserAvatar = ({
  src,
  className,
  ...props
}: GitlabUserAvatar) => {
  return (
    <img
      src={src}
      width={32}
      height={32}
      loading="lazy"
      fetchPriority="low"
      className={cn('rounded-full object-cover', className)}
      {...props}
    />
  );
};
