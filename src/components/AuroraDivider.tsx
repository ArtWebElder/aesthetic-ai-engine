interface AuroraDividerProps {
  className?: string;
}

const AuroraDivider = ({ className = '' }: AuroraDividerProps) => {
  return <div className={`aurora-divider w-full ${className}`} />;
};

export default AuroraDivider;
