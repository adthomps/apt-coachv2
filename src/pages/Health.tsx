import React, { useEffect, useState } from 'react';
import { Activity, Upload } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import GroundTruthLegend from '@/components/health/GroundTruthLegend';
import HealthSourceTabs, { type HealthSourceTab, type WithingsSegment } from '@/components/health/HealthSourceTabs';
import DexaView from '@/components/health/views/DexaView';
import RythmBloodView from '@/components/health/views/RythmBloodView';
import AppleHealthView from '@/components/health/views/AppleHealthView';
import WithingsScaleView from '@/components/health/views/WithingsScaleView';
import WithingsBpmView from '@/components/health/views/WithingsBpmView';
import WithingsBeamoView from '@/components/health/views/WithingsBeamoView';
import SkulptView from '@/components/health/views/SkulptView';
import LumenView from '@/components/health/views/LumenView';

const VALID_TABS: HealthSourceTab[] = ['dexa', 'rythm', 'apple', 'withings', 'skulpt', 'lumen'];
const VALID_SEGMENTS: WithingsSegment[] = ['scale', 'bpm', 'beamo'];

const Health: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const sourceParam = params.get('source');
  const segmentParam = params.get('segment');

  const initialTab: HealthSourceTab =
    VALID_TABS.includes(sourceParam as HealthSourceTab) ? (sourceParam as HealthSourceTab) : 'dexa';
  const initialSegment: WithingsSegment =
    VALID_SEGMENTS.includes(segmentParam as WithingsSegment) ? (segmentParam as WithingsSegment) : 'scale';

  const [active, setActive] = useState<HealthSourceTab>(initialTab);
  const [withingsSegment, setWithingsSegment] = useState<WithingsSegment>(initialSegment);

  // Sync URL when user changes tabs (so links are shareable + back/forward works).
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (active === 'dexa') next.delete('source'); else next.set('source', active);
    if (active === 'withings' && withingsSegment !== 'scale') next.set('segment', withingsSegment);
    else next.delete('segment');
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, withingsSegment]);

  // React to external URL changes (e.g. deep-link click).
  useEffect(() => {
    if (sourceParam && VALID_TABS.includes(sourceParam as HealthSourceTab) && sourceParam !== active) {
      setActive(sourceParam as HealthSourceTab);
    }
    if (segmentParam && VALID_SEGMENTS.includes(segmentParam as WithingsSegment) && segmentParam !== withingsSegment) {
      setWithingsSegment(segmentParam as WithingsSegment);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceParam, segmentParam]);

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Health Data"
          icon={<Activity className="h-8 w-8 text-primary" />}
          description="Body composition, blood markers, daily vitals — full detail view across every source."
          actions={
            <Link to="/admin?tab=imports">
              <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Import in Admin</Button>
            </Link>
          }
        />

        <GroundTruthLegend />

        <HealthSourceTabs
          active={active}
          onChange={setActive}
          withingsSegment={withingsSegment}
          onWithingsSegmentChange={setWithingsSegment}
        />

        <div>
          {active === 'dexa'  && <DexaView />}
          {active === 'rythm' && <RythmBloodView />}
          {active === 'apple' && <AppleHealthView />}
          {active === 'withings' && withingsSegment === 'scale' && <WithingsScaleView />}
          {active === 'withings' && withingsSegment === 'bpm'   && <WithingsBpmView />}
          {active === 'withings' && withingsSegment === 'beamo' && <WithingsBeamoView />}
          {active === 'skulpt' && <SkulptView />}
          {active === 'lumen'  && <LumenView />}
        </div>
      </div>
    </Layout>
  );
};

export default Health;
