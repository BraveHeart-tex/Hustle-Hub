import { useTheme } from '@/components/newtab/ThemeProvider';
import { Badge } from '@/components/ui/badge';
import {
  darkenHexColor,
  formatGitLabLabel,
  getForegroundColor,
} from '@/lib/utils';
import { GitlabMergeRequest } from '@/types/gitlab';

const MRLabel = ({
  label,
}: {
  label: GitlabMergeRequest['labels'][number];
}) => {
  const { theme } = useTheme();

  const labelBackgroundColor = useMemo(() => {
    return theme === 'dark' ? darkenHexColor(label.color) : label.color;
  }, [label.color, theme]);

  const labelForegroundColor = useMemo(() => {
    return getForegroundColor(labelBackgroundColor);
  }, [labelBackgroundColor]);

  return (
    <Badge
      key={label.title}
      variant="outline"
      className="text-xs border-0"
      style={{
        backgroundColor: labelBackgroundColor,
        color: labelForegroundColor,
      }}
    >
      {formatGitLabLabel(label.title)}
    </Badge>
  );
};
export default MRLabel;
