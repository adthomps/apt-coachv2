import React, { useState } from 'react';
import { Activity, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
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

const Health: React.FC = () => {
  const [active, setActive] = useState<HealthSourceTab>('dexa');
  const [withingsSegment, setWithingsSegment] = useState<WithingsSegment>('scale');

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
