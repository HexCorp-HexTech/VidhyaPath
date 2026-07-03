/* ============================================
   VIDYA AI — Teacher Student Directory
   ============================================ */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, ArrowLeft,
  TrendingUp, Flame, Star, Sparkles, MessageSquare
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/Progress';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { db } from '../../lib/db';
import { AvatarIcon } from '../../components/ui/AvatarIcon';
import { computeStudentMastery } from '../../lib/compute-mastery';
import './Students.css';



interface StudentData {
  id: string;
  name: string;
  avatarId: string;
  mastery: number;
  streak: number;
  riskLevel: 'low' | 'medium' | 'high';
  classCode: string;
  grade?: number;
  board?: string;
}

export const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { teacherProfile } = useAuthStore();
  const activeCode = teacherProfile?.activeClassroomCode || '';
  const [classroomStudents, setClassroomStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClassStudents = async () => {
      if (!activeCode) {
        setClassroomStudents([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const profiles = await db.studentProfiles.toArray();
        const classProfiles = profiles.filter(p => p.classCode === activeCode);
        
        const studentsList = [];
        for (const cp of classProfiles) {
          const userRec = await db.users.get(cp.userId);
          if (userRec) {
            const mastery = await computeStudentMastery(cp.userId);
            const riskLevel = mastery >= 0.7 ? 'low' : mastery >= 0.5 ? 'medium' : 'high';
            
            studentsList.push({
              id: cp.userId,
              name: userRec.name,
              avatarId: userRec.avatarId || 'owl',
              mastery,
              streak: cp.streakCurrent || 0,
              riskLevel: riskLevel as 'low' | 'medium' | 'high',
              classCode: activeCode,
              grade: cp.grade,
              board: cp.board
            });
          }
        }
        setClassroomStudents(studentsList);
      } catch (err) {
        console.error('Failed to load students in directory', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClassStudents();
  }, [activeCode]);

  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'mastery-desc' | 'mastery-asc' | 'streak'>('name');
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const [subjectScores, setSubjectScores] = useState<{ name: string; score: number; color: string }[]>([]);
  const [strongConcepts, setStrongConcepts] = useState<string[]>([]);
  const [practiceConcepts, setPracticeConcepts] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedStudent) return;
    const fetchStudentMetrics = async () => {
      try {
        const allSubjects = await db.subjects.toArray();
        const scores: { name: string; score: number; color: string }[] = [];
        for (const subj of allSubjects) {
          const chapters = await db.chapters.where('subjectId').equals(subj.id).toArray();
          if (chapters.length === 0) continue;

          let studentSubjScore = 0;
          let studentChapCount = 0;
          for (const ch of chapters) {
            const bktRecords = await db.bktMastery
              .where('userId').equals(selectedStudent.id)
              .and(r => r.chapterId === ch.id)
              .toArray();
            if (bktRecords.length > 0) {
              const avgBkt = bktRecords.reduce((s, r) => s + r.pKnow, 0) / bktRecords.length;
              studentSubjScore += avgBkt * 100;
              studentChapCount++;
            } else {
              const attempts = await db.quizAttempts
                .where('userId').equals(selectedStudent.id)
                .and(a => a.chapterId === ch.id)
                .toArray();
              if (attempts.length > 0) {
                const maxScore = Math.max(...attempts.map(a => {
                  const sc = a.score ?? 0;
                  return sc > 1 ? sc : sc * 100;
                }));
                studentSubjScore += maxScore;
                studentChapCount++;
              }
            }
          }
          const scoreVal = studentChapCount > 0 ? Math.round(studentSubjScore / studentChapCount) : 0;
          scores.push({
            name: subj.name,
            score: scoreVal,
            color: subj.color || '#4ECDC4'
          });
        }
        setSubjectScores(scores);

        // Fetch BKT strong vs practice concepts
        const allChapters = await db.chapters.toArray();
        const strongList: string[] = [];
        const practiceList: string[] = [];

        for (const ch of allChapters) {
          const bkt = await db.bktMastery
            .where('userId').equals(selectedStudent.id)
            .and(r => r.chapterId === ch.id)
            .toArray();
          if (bkt.length > 0) {
            const avg = bkt.reduce((s, r) => s + r.pKnow, 0) / bkt.length;
            if (avg >= 0.75) {
              strongList.push(ch.title);
            } else if (avg < 0.6) {
              practiceList.push(ch.title);
            }
          } else {
            // Check quiz scores for that chapter
            const attempts = await db.quizAttempts
              .where('userId').equals(selectedStudent.id)
              .and(a => a.chapterId === ch.id)
              .toArray();
            if (attempts.length > 0) {
              const maxScore = Math.max(...attempts.map(a => a.score ?? 0));
              const pct = maxScore > 1 ? maxScore / 100 : maxScore;
              if (pct >= 0.75) {
                strongList.push(ch.title);
              } else if (pct > 0 && pct < 0.6) {
                practiceList.push(ch.title);
              }
            }
          }
        }

        if (strongList.length === 0) strongList.push('No concepts fully mastered yet.');
        if (practiceList.length === 0) practiceList.push('No urgent concept gaps detected.');

        setStrongConcepts(strongList);
        setPracticeConcepts(practiceList);

      } catch (err) {
        console.error('Failed to load student details metrics', err);
      }
    };
    fetchStudentMetrics();
  }, [selectedStudent]);

  if (loading) {
    return (
      <div className="tstudents" style={{ padding: 'var(--sp-10)', textAlign: 'center' }}>
        <p>Loading student directory...</p>
      </div>
    );
  }

  // Filter & Sort
  const filteredStudents = classroomStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'all' || student.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'mastery-desc') return b.mastery - a.mastery;
    if (sortBy === 'mastery-asc') return a.mastery - b.mastery;
    if (sortBy === 'streak') return b.streak - a.streak;
    return 0;
  });

  const handleRecommendRevision = (studentName: string) => {
    setActionNotice(`AI Revision plan on 'Linear Equations' generated and sent to ${studentName}!`);
    setTimeout(() => {
      setActionNotice(null);
    }, 4000);
  };

  // Render detail sub-view
  if (selectedStudent) {

    return (
      <div className="tstudents">
        <button className="doubt-detail__back" onClick={() => setSelectedStudent(null)} style={{ marginBottom: 'var(--sp-4)' }}>
          <ArrowLeft size={16} /> Back to Directory
        </button>

        {actionNotice && (
          <div style={{
            background: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            padding: 'var(--sp-3) var(--sp-4)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 'var(--fw-bold)',
            marginBottom: 'var(--sp-4)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sp-2)'
          }}>
            <Sparkles size={16} />
            <span>{actionNotice}</span>
          </div>
        )}

        <div className="student-detail-panel">
          <Card className="student-detail-card">
            <div className="student-detail__header">
              <div className="student-detail__title">
                <span className="student-card__avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-border)', borderRadius: '50%', width: '48px', height: '48px' }}>
                  <AvatarIcon id={selectedStudent.avatarId} size={32} />
                </span>
                <div>
                  <h2 className="student-detail__name">{selectedStudent.name}</h2>
                  <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--fs-body-sm)' }}>Grade {selectedStudent.grade || 10} • {selectedStudent.board || 'CBSE'}</span>
                </div>
              </div>

              <span className={`student-card__risk student-card__risk--${selectedStudent.riskLevel}`}>
                {selectedStudent.riskLevel} Risk
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--sp-4)', marginBottom: 'var(--sp-8)' }}>
              <div style={{ padding: 'var(--sp-4)', background: 'var(--color-surface-bg)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <TrendingUp size={20} color="var(--color-success)" style={{ margin: '0 auto var(--sp-1) auto' }} />
                <div style={{ fontSize: 'var(--fs-h4)', fontWeight: 800 }}>{Math.round(selectedStudent.mastery * 100)}%</div>
                <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--color-text-secondary)' }}>Mastery</div>
              </div>
              <div style={{ padding: 'var(--sp-4)', background: 'var(--color-surface-bg)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <Flame size={20} color="#FF6B6B" style={{ margin: '0 auto var(--sp-1) auto' }} />
                <div style={{ fontSize: 'var(--fs-h4)', fontWeight: 800 }}>{selectedStudent.streak}</div>
                <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--color-text-secondary)' }}>Streak</div>
              </div>
              <div style={{ padding: 'var(--sp-4)', background: 'var(--color-surface-bg)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <Star size={20} color="#BB8FCE" style={{ margin: '0 auto var(--sp-1) auto' }} />
                <div style={{ fontSize: 'var(--fs-h4)', fontWeight: 800 }}>Lvl {Math.round(selectedStudent.mastery * 6)}</div>
                <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--color-text-secondary)' }}>Rank</div>
              </div>
            </div>

            <h3 style={{ fontSize: 'var(--fs-h4)', fontWeight: 800, marginBottom: 'var(--sp-4)' }}>Subject Mastery</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', marginBottom: 'var(--sp-8)' }}>
              {subjectScores.map((score: { name: string; score: number; color: string }) => (
                <div key={score.name} className="student-detail__subject-row">
                  <span className="student-detail__subject-label">{score.name}</span>
                  <div className="student-detail__subject-progress">
                    <ProgressBar value={score.score} color={score.color} size="sm" />
                  </div>
                  <span className="student-detail__subject-val">{score.score}%</span>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: 'var(--fs-h4)', fontWeight: 800, marginBottom: 'var(--sp-4)' }}>Learning Analytics</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', marginBottom: 'var(--sp-8)' }}>
              <div style={{ padding: 'var(--sp-3)', background: 'rgba(0, 184, 124, 0.05)', borderLeft: '4px solid var(--color-success)', borderRadius: 'var(--radius-sm)' }}>
                <h4 style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-body-sm)', color: 'var(--color-success)', marginBottom: 'var(--sp-1)' }}>Strong Concepts</h4>
                <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--color-text-secondary)' }}>{strongConcepts.join(', ')}</p>
              </div>

              <div style={{ padding: 'var(--sp-3)', background: 'rgba(217, 48, 37, 0.05)', borderLeft: '4px solid var(--color-error)', borderRadius: 'var(--radius-sm)' }}>
                <h4 style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-body-sm)', color: 'var(--color-error)', marginBottom: 'var(--sp-1)' }}>Areas for Practice</h4>
                <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--color-text-secondary)' }}>{practiceConcepts.join(', ')}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--sp-4)' }}>
              <Button variant="primary" icon={Sparkles} onClick={() => handleRecommendRevision(selectedStudent.name)}>
                Recommend AI Revision
              </Button>
              <Button variant="secondary" icon={MessageSquare} onClick={() => navigate('/teacher/doubts')}>
                View Student Doubts
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="tstudents">
      <div className="tstudents__header">
        <div>
          <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--color-text-tertiary)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase' }}>Class Code: {activeCode}</span>
          <h1 style={{ fontSize: 'var(--fs-h2)', fontWeight: 800 }}>Student Directory</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', background: 'var(--color-surface-bg)', padding: 'var(--sp-2) var(--sp-4)', borderRadius: 'var(--radius-md)' }}>
          <Users size={16} />
          <span style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-body-sm)' }}>{classroomStudents.length} Students</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="tstudents__filters">
        <input
          type="text"
          className="tstudents__search"
          placeholder="Search students by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="tstudents__select"
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value as any)}
        >
          <option value="all">All Risk Levels</option>
          <option value="high">High Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="low">Low Risk</option>
        </select>

        <select
          className="tstudents__select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
        >
          <option value="name">Sort by Name</option>
          <option value="mastery-desc">Mastery (High to Low)</option>
          <option value="mastery-asc">Mastery (Low to High)</option>
          <option value="streak">Study Streak</option>
        </select>
      </div>

      {/* Grid */}
      <div className="tstudents__grid">
        {filteredStudents.map((student, i) => {
          return (
            <Card
              key={i}
              variant="interactive"
              className="student-card"
              onClick={() => setSelectedStudent(student)}
            >
              <div className="student-card__header">
                <span className="student-card__avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-border)', borderRadius: '50%', width: '36px', height: '36px' }}>
                  <AvatarIcon id={student.avatarId} size={24} />
                </span>
                <div>
                  <div className="student-card__name">{student.name}</div>
                  <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--color-text-tertiary)' }}>Lvl {Math.round(student.mastery * 6)}</span>
                </div>

                <span className={`student-card__risk student-card__risk--${student.riskLevel}`}>
                  {student.riskLevel}
                </span>
              </div>

              <div style={{ marginBottom: 'var(--sp-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-caption)', color: 'var(--color-text-secondary)', marginBottom: 'var(--sp-1)', fontWeight: 'var(--fw-semibold)' }}>
                  <span>Subject Mastery</span>
                  <span>{Math.round(student.mastery * 100)}%</span>
                </div>
                <ProgressBar value={student.mastery * 100} size="sm" color="var(--color-primary)" animated={false} />
              </div>

              <div className="student-card__stats">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)' }}>
                  <Flame size={14} color="#FF6B6B" /> {student.streak} days
                </div>
                <div style={{ textAlign: 'right' }}>
                  Grade {student.grade || 10} • {student.board || 'CBSE'}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
