import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { missionIcon } from '../../components/map/nodes.jsx';
import ReadMission from './ReadMission.jsx';
import PracticeMission from './PracticeMission.jsx';
import GateMission from './GateMission.jsx';

export default function MissionPlayer({ subject, country, city }) {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const mission = city.missions.find((m) => m.id === missionId);

  const close = () => navigate(`/${subject.id}/${city.id}`);

  if (!mission) return null;

  return (
    <div className="mission-detail-overlay" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="mission-detail">
        <div className="mission-detail-head">
          <span style={{ fontSize: '1.6rem' }}>{missionIcon(mission.type)}</span>
          <h2>{mission.title}</h2>
          <span className="goal-chip" style={{ background: '#2b2350', color: '#ffd23f', borderColor: '#2b2350' }}>
            +{mission.xp ?? 0} XP
          </span>
          <button className="candy-btn ghost" onClick={close}>✕ Close</button>
        </div>
        <div className="mission-detail-body">
          {mission.type === 'READ' && <ReadMission subject={subject} mission={mission} />}
          {mission.type === 'PRACTICE' && <PracticeMission subject={subject} mission={mission} onDone={close} />}
          {mission.type === 'GATE' && <GateMission subject={subject} mission={mission} />}
        </div>
      </div>
    </div>
  );
}
