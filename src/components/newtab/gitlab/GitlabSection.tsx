import GitlabIcon from '@/components/misc/GitlabIcon';
import MRItem from '@/components/newtab/gitlab/MRItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchStats } from '@/services/gitlab';
import { GitLabMRResponse } from '@/types/gitlab';

export default function GitlabSection() {
  const [mrDdata, setMrDdata] = useState<GitLabMRResponse>({
    assigned: [],
    review: [],
  });

  useEffect(() => {
    const getData = async () => {
      const result = await fetchStats();

      setMrDdata(result);
    };

    getData();
  }, []);

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <GitlabIcon className="h-5 w-5" />
          GitLab MRs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mrDdata.assigned.map((mr) => (
          <MRItem mr={mr} key={mr.id} />
        ))}
        {mrDdata.review.map((mr) => (
          <MRItem mr={mr} key={mr.id} />
        ))}
      </CardContent>
    </Card>
  );
}
