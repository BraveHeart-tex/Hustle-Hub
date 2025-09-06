interface JiraIconProps {
  className?: string;
  width?: number;
  height?: number;
}

const JiraIcon = ({
  className = 'text-blue-600',
  width = 16,
  height = 16,
}: JiraIconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill="currentColor"
      d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.97 4.35 4.35 4.35V2.84c0-.46-.37-.84-.84-.84H11.53zM6.77 6.8c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.97 4.35 4.35 4.35V7.64c0-.46-.37-.84-.84-.84H6.77zM2 11.6c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.97 4.35 4.35 4.35v-9.56c0-.46-.37-.84-.84-.84H2z"
    />
  </svg>
);

export default JiraIcon;
