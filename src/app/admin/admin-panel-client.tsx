'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import { 
  Users, BookOpen, Layers, FileText, Search, Edit2, Trash2, 
  ChevronUp, ChevronDown, UserPlus, Upload, ShieldCheck, 
  Menu, LogOut, Wand2, AlertTriangle, CheckCircle2, Loader2, Plus, 
  MessageSquare, Settings, Copy, Check, ExternalLink 
} from 'lucide-react';
import { toast } from 'sonner';

// Import actions
import { saveCourse, deleteCourse, moveCourse } from './courses/actions';
import { saveStudent, deleteStudent, bulkCreateStudents } from './students/actions';
import { saveScenario, deleteScenario } from './scenarios/actions';

interface StudentDTO {
  id: string;
  name: string;
  email: string;
  xp: number;
  streakCount: number;
  lessonsCompleted: number;
  enrolledCourses: string[];
  lastActiveOn: string | null;
}

interface CourseDTO {
  id: string;
  title: string;
  description: string | null;
  level: string | null;
  coverColor: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  modulesCount: number;
  enrollmentsCount: number;
  order: number;
}

interface ScenarioDTO {
  id: string;
  title: string;
  description: string | null;
  setting: string | null;
  aiRolePrompt: string;
  level: string | null;
  icon: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  phrasesCount: number;
  conversationsCount: number;
}

interface AdminPanelClientProps {
  adminName: string;
  stats: {
    students: number;
    courses: number;
    modules: number;
    lessons: number;
  };
  recentStudents: {
    id: string;
    name: string;
    email: string;
    xp: number;
    lastActiveOn: Date | null;
  }[];
  students: StudentDTO[];
  courses: CourseDTO[];
  scenarios: ScenarioDTO[];
  apiKeyConfigured: boolean;
}

export default function AdminPanelClient({
  adminName,
  stats,
  recentStudents,
  students,
  courses,
  scenarios,
  apiKeyConfigured
}: AdminPanelClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'scenarios' | 'students' | 'generate'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync tab selection with hash routing
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#courses') setActiveTab('courses');
      else if (hash === '#scenarios') setActiveTab('scenarios');
      else if (hash === '#students') setActiveTab('students');
      else if (hash === '#generate') setActiveTab('generate');
      else setActiveTab('overview');
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // --- Courses CRUD State ---
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showCourseDeleteConfirm, setShowCourseDeleteConfirm] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseLevel, setCourseLevel] = useState('A1');
  const [courseColor, setCourseColor] = useState('#3d6b65');
  const [courseStatus, setCourseStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');

  // --- Students CRUD State ---
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showStudentDeleteConfirm, setShowStudentDeleteConfirm] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPw, setStudentPw] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [bulkCsv, setBulkCsv] = useState('');

  // --- Scenarios CRUD State ---
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [showScenarioDeleteConfirm, setShowScenarioDeleteConfirm] = useState<string | null>(null);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [scenarioTitle, setScenarioTitle] = useState('');
  const [scenarioDesc, setScenarioDesc] = useState('');
  const [scenarioSetting, setScenarioSetting] = useState('');
  const [scenarioRolePrompt, setScenarioRolePrompt] = useState('');
  const [scenarioLevel, setScenarioLevel] = useState('A1');
  const [scenarioIcon, setScenarioIcon] = useState('💬');
  const [scenarioStatus, setScenarioStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');

  // --- AI Gen State ---
  const [aiGenCourseId, setAiGenCourseId] = useState(courses[0]?.id || '');
  const [aiGenModuleTitle, setAiGenModuleTitle] = useState('Greetings & Basics');
  const [aiGenSourceText, setAiGenSourceText] = useState('');
  const [aiGenMcqs, setAiGenMcqs] = useState(5);
  const [aiGenQuiz, setAiGenQuiz] = useState(5);
  const [aiGenFlashcards, setAiGenFlashcards] = useState(10);
  const [aiGenLevel, setAiGenLevel] = useState('A1');
  const [aiGenVideo, setAiGenVideo] = useState('');
  const [aiGenLoading, setAiGenLoading] = useState(false);
  const [aiGenResult, setAiGenResult] = useState<{ mcqs: number; quizQs: number; flashcards: number } | null>(null);
  const [aiGenError, setAiGenError] = useState<string | null>(null);

  // --- Handlers: Courses ---
  const handleOpenNewCourse = () => {
    setCourseId(null);
    setCourseTitle('');
    setCourseDesc('');
    setCourseLevel('A1');
    setCourseColor('#3d6b65');
    setCourseStatus('DRAFT');
    setShowCourseModal(true);
  };

  const handleOpenEditCourse = (c: CourseDTO) => {
    setCourseId(c.id);
    setCourseTitle(c.title);
    setCourseDesc(c.description || '');
    setCourseLevel(c.level || 'A1');
    setCourseColor(c.coverColor || '#3d6b65');
    setCourseStatus(c.status);
    setShowCourseModal(true);
  };

  const handleSaveCourse = () => {
    if (!courseTitle.trim()) return;
    startTransition(async () => {
      const res = await saveCourse({
        id: courseId || undefined,
        title: courseTitle,
        description: courseDesc,
        level: courseLevel,
        coverColor: courseColor,
        status: courseStatus,
      });
      if (res.ok) {
        toast.success(courseId ? 'Course updated' : 'Course created');
        setShowCourseModal(false);
        router.refresh();
      } else {
        toast.error('Failed to save course');
      }
    });
  };

  const handleDeleteCourse = (id: string) => {
    startTransition(async () => {
      await deleteCourse(id);
      toast.success('Course deleted');
      setShowCourseDeleteConfirm(null);
      router.refresh();
    });
  };

  const handleMoveCourse = (id: string, dir: 'up' | 'down') => {
    startTransition(async () => {
      await moveCourse(id, dir);
      router.refresh();
    });
  };

  // --- Handlers: Students ---
  const handleOpenNewStudent = () => {
    setStudentId(null);
    setStudentName('');
    setStudentEmail('');
    setStudentPw('');
    setShowStudentModal(true);
  };

  const handleOpenEditStudent = (s: StudentDTO) => {
    setStudentId(s.id);
    setStudentName(s.name);
    setStudentEmail(s.email);
    setStudentPw(''); // empty password by default on edit
    setShowStudentModal(true);
  };

  const handleSaveStudent = () => {
    if (!studentName.trim() || !studentEmail.trim()) return;
    startTransition(async () => {
      const res = await saveStudent({
        id: studentId || undefined,
        name: studentName,
        email: studentEmail,
        password: studentPw || undefined,
      });
      if (res.ok) {
        toast.success(studentId ? 'Student updated' : 'Student created');
        setShowStudentModal(false);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to save student');
      }
    });
  };

  const handleDeleteStudent = (id: string) => {
    startTransition(async () => {
      await deleteStudent(id);
      toast.success('Student deleted');
      setShowStudentDeleteConfirm(null);
      router.refresh();
    });
  };

  const handleBulkAdd = () => {
    const lines = bulkCsv.trim().split('\n').filter(Boolean);
    const rows: { name: string; email: string; password: string }[] = [];
    for (const line of lines) {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length < 2) continue;
      rows.push({
        name: parts[0],
        email: parts[1],
        password: parts[2] || 'password123',
      });
    }

    if (rows.length === 0) return;

    startTransition(async () => {
      const res = await bulkCreateStudents({ rows });
      if (res.ok) {
        toast.success(`Imported: created ${res.created}, skipped ${res.skipped} duplicates`);
        setShowBulkAddModal(false);
        setBulkCsv('');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed bulk import');
      }
    });
  };

  // --- Handlers: Scenarios ---
  const handleOpenNewScenario = () => {
    setScenarioId(null);
    setScenarioTitle('');
    setScenarioDesc('');
    setScenarioSetting('');
    setScenarioRolePrompt('You are a helpful Israeli supermarket cashier. Speak simple A1 Hebrew. Translate every line in parentheses.');
    setScenarioLevel('A1');
    setScenarioIcon('💬');
    setScenarioStatus('DRAFT');
    setShowScenarioModal(true);
  };

  const handleOpenEditScenario = (s: ScenarioDTO) => {
    setScenarioId(s.id);
    setScenarioTitle(s.title);
    setScenarioDesc(s.description || '');
    setScenarioSetting(s.setting || '');
    setScenarioRolePrompt(s.aiRolePrompt);
    setScenarioLevel(s.level || 'A1');
    setScenarioIcon(s.icon || '💬');
    setScenarioStatus(s.status);
    setShowScenarioModal(true);
  };

  const handleSaveScenario = () => {
    if (!scenarioTitle.trim() || !scenarioRolePrompt.trim()) return;
    startTransition(async () => {
      const res = await saveScenario({
        id: scenarioId || undefined,
        title: scenarioTitle,
        description: scenarioDesc,
        setting: scenarioSetting,
        aiRolePrompt: scenarioRolePrompt,
        level: scenarioLevel,
        icon: scenarioIcon,
        status: scenarioStatus,
      });
      if (res.ok) {
        toast.success(scenarioId ? 'Scenario updated' : 'Scenario created');
        setShowScenarioModal(false);
        router.refresh();
      } else {
        toast.error('Failed to save scenario');
      }
    });
  };

  const handleDeleteScenario = (id: string) => {
    startTransition(async () => {
      await deleteScenario(id);
      toast.success('Scenario deleted');
      setShowScenarioDeleteConfirm(null);
      router.refresh();
    });
  };

  // --- Handlers: AI Generator ---
  const handleAIGenerate = async () => {
    if (!aiGenModuleTitle.trim() || !aiGenSourceText.trim()) return;
    setAiGenLoading(true);
    setAiGenError(null);
    setAiGenResult(null);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: aiGenCourseId,
          moduleTitle: aiGenModuleTitle,
          sourceText: aiGenSourceText,
          mcqCount: aiGenMcqs,
          quizQuestionCount: aiGenQuiz,
          flashcardCount: aiGenFlashcards,
          level: aiGenLevel,
          videoUrl: aiGenVideo,
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        setAiGenError(data.error || 'Failed to generate content');
        toast.error('AI generation failed');
      } else {
        setAiGenResult({
          mcqs: aiGenMcqs,
          quizQs: aiGenQuiz,
          flashcards: aiGenFlashcards,
        });
        toast.success('Module drafted successfully');
        setAiGenSourceText('');
        router.refresh();
      }
    } catch (e) {
      setAiGenError('Network error — could not connect to AI services.');
    } finally {
      setAiGenLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex">
      {/* Sidebar navigation */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Topbar */}
        <div>
          <header className="sticky top-0 z-30 w-full border-b border-border bg-surface/90 backdrop-blur-md">
            <div className="h-16 flex items-center justify-between px-6 gap-4">
              <h1 className="font-bold text-ink text-lg hidden sm:block">Admin Console</h1>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted">Signed in as {adminName}</span>
                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
              </div>
            </div>
          </header>
        </div>

        {/* Dynamic section viewport */}
        <main className="flex-1 px-6 py-8 flex flex-col gap-8 max-w-screen-2xl">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6 animate-pop-in">
              <h2 className="text-section text-ink">Overview</h2>
              
              {/* Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Students', value: stats.students, icon: Users, bg: 'hsl(170 28% 32% / 0.1)', color: 'var(--primary)' },
                  { label: 'Courses', value: stats.courses, icon: BookOpen, bg: 'hsl(32 78% 56% / 0.1)', color: 'var(--accent)' },
                  { label: 'Modules', value: stats.modules, icon: Layers, bg: 'hsl(145 55% 38% / 0.1)', color: 'var(--success)' },
                  { label: 'Lessons', value: stats.lessons, icon: FileText, bg: 'hsl(270 40% 50% / 0.1)', color: '#7c4dbd' },
                ].map((s) => (
                  <div key={`stat-${s.label}`} className="card-base p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: s.bg }}>
                      <s.icon size={22} style={{ color: s.color }} />
                    </div>
                    <div>
                      <p className="text-eyebrow text-muted">{s.label}</p>
                      <p className="text-2xl font-bold text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Students Log */}
              <div className="card-base p-5 flex flex-col gap-4">
                <h3 className="font-bold text-ink text-base">Recently active students</h3>
                <div className="overflow-hidden">
                  <ul className="divide-y divide-border">
                    {recentStudents.map((s) => (
                      <li key={s.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                        <div>
                          <p className="font-semibold text-ink text-sm">{s.name}</p>
                          <p className="text-xs text-muted mt-0.5">{s.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-accent">{s.xp} XP</p>
                          <p className="text-xs text-muted mt-0.5">
                            {s.lastActiveOn ? new Date(s.lastActiveOn).toLocaleDateString() : 'Never'}
                          </p>
                        </div>
                      </li>
                    ))}
                    {recentStudents.length === 0 && (
                      <li className="py-8 text-center text-muted text-sm">
                        No student activity registered.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COURSES */}
          {activeTab === 'courses' && (
            <div className="flex flex-col gap-6 animate-pop-in">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-section text-ink">Courses</h2>
                <button onClick={handleOpenNewCourse} className="btn-primary text-sm h-9 px-4 gap-1.5">
                  <Plus size={15} /> New course
                </button>
              </div>

              <div className="card-base overflow-hidden divide-y divide-border">
                {courses.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-all group">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold text-white shrink-0"
                      style={{ backgroundColor: c.coverColor || 'var(--primary)', fontFamily: 'var(--font-heebo)' }}
                    >
                      ש
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/admin/courses/${c.id}`}
                          className="font-semibold text-ink hover:text-primary-color transition-colors truncate"
                        >
                          {c.title}
                        </Link>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: c.status === 'PUBLISHED' ? 'hsl(145 55% 38% / 0.1)' : 'hsl(32 78% 56% / 0.1)',
                            color: c.status === 'PUBLISHED' ? 'var(--success)' : '#8b5e10',
                          }}
                        >
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-0.5">
                        {c.modulesCount} modules · {c.enrollmentsCount} enrolled · {c.level || 'A1'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleMoveCourse(c.id, 'up')}
                        disabled={i === 0 || isPending}
                        className="w-7 h-7 flex items-center justify-center rounded text-muted hover:text-ink hover:bg-secondary disabled:opacity-30 transition-all"
                        title="Move up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => handleMoveCourse(c.id, 'down')}
                        disabled={i === courses.length - 1 || isPending}
                        className="w-7 h-7 flex items-center justify-center rounded text-muted hover:text-ink hover:bg-secondary disabled:opacity-30 transition-all"
                        title="Move down"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        onClick={() => handleOpenEditCourse(c)}
                        disabled={isPending}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-primary-color hover:bg-primary/10 transition-all"
                        title="Edit course"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setShowCourseDeleteConfirm(c.id)}
                        disabled={isPending}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-danger-color hover:bg-danger/10 transition-all"
                        title="Delete course"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {courses.length === 0 && (
                  <div className="px-5 py-12 text-center text-muted text-sm bg-surface">
                    No courses registered. Add your first course to begin.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SCENARIOS */}
          {activeTab === 'scenarios' && (
            <div className="flex flex-col gap-6 animate-pop-in">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-section text-ink">Scenarios</h2>
                <button onClick={handleOpenNewScenario} className="btn-primary text-sm h-9 px-4 gap-1.5">
                  <Plus size={15} /> New scenario
                </button>
              </div>

              <div className="card-base overflow-hidden divide-y divide-border">
                {scenarios.map((s) => (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-all group">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0 bg-secondary/50"
                    >
                      {s.icon || '💬'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/admin/scenarios/${s.id}`}
                          className="font-semibold text-ink hover:text-primary-color transition-colors truncate"
                        >
                          {s.title}
                        </Link>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: s.status === 'PUBLISHED' ? 'hsl(145 55% 38% / 0.1)' : 'hsl(32 78% 56% / 0.1)',
                            color: s.status === 'PUBLISHED' ? 'var(--success)' : '#8b5e10',
                          }}
                        >
                          {s.status}
                        </span>
                      </div>
                      {s.description && (
                        <p className="text-xs text-muted mt-0.5 line-clamp-1">{s.description}</p>
                      )}
                      <p className="text-[10px] text-muted font-mono mt-0.5 uppercase">
                        Level: {s.level || 'A1'} · {s.phrasesCount} phrases · {s.conversationsCount} roleplays
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/admin/scenarios/${s.id}`}
                        className="btn-outline text-xs h-8 px-3 gap-1"
                      >
                        Edit Phrases
                      </Link>
                      <button
                        onClick={() => handleOpenEditScenario(s)}
                        disabled={isPending}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-primary-color hover:bg-primary/10 transition-all"
                        title="Edit details"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setShowScenarioDeleteConfirm(s.id)}
                        disabled={isPending}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-danger-color hover:bg-danger/10 transition-all"
                        title="Delete scenario"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {scenarios.length === 0 && (
                  <div className="px-5 py-12 text-center text-muted text-sm bg-surface">
                    No scenarios published. Add one to offer roleplay conversation practice.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: STUDENTS */}
          {activeTab === 'students' && (
            <div className="flex flex-col gap-6 animate-pop-in">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-section text-ink">Students</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowBulkAddModal(true)} className="btn-outline text-sm h-9 px-4 gap-1.5">
                    <Upload size={15} /> Bulk add
                  </button>
                  <button onClick={handleOpenNewStudent} className="btn-primary text-sm h-9 px-4 gap-1.5">
                    <UserPlus size={15} /> New student
                  </button>
                </div>
              </div>

              {/* Search Field */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  className="input-base pl-10"
                  placeholder="Search by name or email…"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>

              {/* Students Grid/Table */}
              <div className="card-base overflow-hidden bg-surface">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-paper">
                        <th className="text-left px-5 py-3 font-semibold text-muted text-xs uppercase tracking-wide">Name</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wide hidden md:table-cell">Email</th>
                        <th className="text-right px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wide">XP</th>
                        <th className="text-right px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wide hidden sm:table-cell">Streak</th>
                        <th className="text-right px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wide hidden lg:table-cell">Lessons</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wide hidden xl:table-cell">Enrolled in</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wide hidden lg:table-cell">Last active</th>
                        <th className="px-4 py-3 w-20"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.filter(s => 
                        s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                        s.email.toLowerCase().includes(studentSearch.toLowerCase())
                      ).map((s, idx) => (
                        <React.Fragment key={s.id}>
                          <tr 
                            className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors"
                            style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : 'hsl(40 38% 97% / 0.3)' }}
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-primary text-white">
                                  {s.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium text-ink">{s.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-muted hidden md:table-cell">{s.email}</td>
                            <td className="px-4 py-3.5 text-right font-semibold text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>
                              {s.xp}
                            </td>
                            <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                              <span className="flex items-center justify-end gap-1">
                                {s.streakCount > 0 && <span className="streak-flame">🔥</span>}
                                <span className="font-semibold text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>{s.streakCount}d</span>
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right text-ink hidden lg:table-cell" style={{ fontVariantNumeric: 'tabular-nums' }}>
                              {s.lessonsCompleted}
                            </td>
                            <td className="px-4 py-3.5 hidden xl:table-cell">
                              <button
                                onClick={() => setExpandedStudentId(expandedStudentId === s.id ? null : s.id)}
                                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                              >
                                {s.enrolledCourses.length} course{s.enrolledCourses.length !== 1 ? 's' : ''}
                                {expandedStudentId === s.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              </button>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-muted hidden lg:table-cell">
                              {s.lastActiveOn ? new Date(s.lastActiveOn).toLocaleDateString() : 'Never'}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-primary-color hover:bg-primary/10 transition-all"
                                  onClick={() => handleOpenEditStudent(s)}
                                  title="Edit student details"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-danger-color hover:bg-danger/10 transition-all"
                                  onClick={() => setShowStudentDeleteConfirm(s.id)}
                                  title="Delete student"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedStudentId === s.id && (
                            <tr className="border-b border-border bg-paper/50">
                              <td colSpan={8} className="px-5 py-3">
                                <div className="flex flex-wrap gap-2">
                                  {s.enrolledCourses.map((c) => (
                                    <span key={`${s.id}-enrolled-${c}`} className="badge-level">{c}</span>
                                  ))}
                                  {s.enrolledCourses.length === 0 && (
                                    <span className="text-xs text-muted italic">Not enrolled in any courses</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AI MODULE GENERATOR */}
          {activeTab === 'generate' && (
            <div className="flex flex-col gap-6 animate-pop-in">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Wand2 size={20} style={{ color: 'var(--accent)' }} />
                  <p className="text-eyebrow" style={{ color: 'var(--accent)' }}>AI GENERATOR</p>
                </div>
                <h2 className="text-section text-ink">Draft a module from text</h2>
                <p className="text-sm text-muted max-w-2xl leading-relaxed">
                  Paste a lesson transcript or teaching notes below. The AI will output multiple-choice questions, a graded quiz, and a flashcard deck as a DRAFT module under the chosen course.
                </p>
              </div>

              {!apiKeyConfigured && (
                <div
                  className="rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                  style={{ backgroundColor: 'hsl(32 78% 56% / 0.08)', border: '1px solid hsl(32 78% 56% / 0.3)' }}
                >
                  <AlertTriangle size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <div className="flex-1">
                    <p className="font-semibold text-ink text-sm">AI API Key is not set</p>
                    <p className="text-sm text-muted mt-0.5">
                      Get a free Gemini API key from Google AI Studio, then add it to your environment config.
                    </p>
                  </div>
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline text-sm h-9 px-4 gap-1.5 shrink-0"
                  >
                    Get key
                    <ExternalLink size={13} />
                  </a>
                </div>
              )}

              <div className="card-base p-6 flex flex-col gap-5 bg-surface">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-eyebrow text-muted">Target Course</label>
                    <select
                      className="input-base"
                      value={aiGenCourseId}
                      onChange={(e) => setAiGenCourseId(e.target.value)}
                      style={{ appearance: 'none' }}
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-eyebrow text-muted">Module Title</label>
                    <input
                      className="input-base"
                      placeholder="e.g. Caregiving Vocabulary"
                      value={aiGenModuleTitle}
                      onChange={(e) => setAiGenModuleTitle(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-eyebrow text-muted">Source Material (transcripts, notes, lists)</label>
                    <button
                      onClick={() => setAiGenSourceText(
                        `Hello! Today we will learn care words.\n` +
                        `Shalom (שלום) is hello, goodbye, or peace.\n` +
                        `Toda (תודה) is thank you.\n` +
                        `Mayim (מים) is water.\n` +
                        `Trufa (תרופה) is medicine.\n` +
                        `Yesh li ke'ev (יש לי כאב) means "I have pain".`
                      )}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Use Sample
                    </button>
                  </div>
                  <textarea
                    className="input-base font-mono text-sm"
                    style={{ height: 180, resize: 'vertical', padding: '12px 14px' }}
                    placeholder="Paste teaching text or audio transcripts here..."
                    value={aiGenSourceText}
                    onChange={(e) => setAiGenSourceText(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-eyebrow text-muted font-bold">MCQs</label>
                    <input className="input-base" type="number" min={1} max={15} value={aiGenMcqs} onChange={(e) => setAiGenMcqs(Number(e.target.value))} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-eyebrow text-muted font-bold">Quiz Qs</label>
                    <input className="input-base" type="number" min={1} max={15} value={aiGenQuiz} onChange={(e) => setAiGenQuiz(Number(e.target.value))} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-eyebrow text-muted font-bold">Flashcards</label>
                    <input className="input-base" type="number" min={1} max={30} value={aiGenFlashcards} onChange={(e) => setAiGenFlashcards(Number(e.target.value))} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-eyebrow text-muted font-bold">Level</label>
                    <select className="input-base" value={aiGenLevel} onChange={(e) => setAiGenLevel(e.target.value)} style={{ appearance: 'none' }}>
                      <option value="A1">A1</option>
                      <option value="A2">A2</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-eyebrow text-muted">Optional Video URL</label>
                  <input className="input-base" type="url" placeholder="https://youtube.com/watch?v=..." value={aiGenVideo} onChange={(e) => setAiGenVideo(e.target.value)} />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <p className="text-xs text-muted">Module drafts are saved as DRAFT status.</p>
                  <button
                    onClick={handleAIGenerate}
                    disabled={aiGenLoading || !aiGenModuleTitle.trim() || !aiGenSourceText.trim() || !apiKeyConfigured}
                    className="btn-primary gap-2"
                  >
                    {aiGenLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <Wand2 size={16} />
                        Generate Module
                      </>
                    )}
                  </button>
                </div>

                {/* AI Success Result Box */}
                {aiGenResult && (
                  <div className="rounded-xl p-5 flex items-start gap-4 bg-success/10 border border-success/30">
                    <CheckCircle2 size={20} className="text-success shrink-0" />
                    <div>
                      <p className="font-semibold text-sm text-success">Draft module generated successfully!</p>
                      <p className="text-xs text-muted mt-1">
                        Created {aiGenResult.mcqs} MCQs, {aiGenResult.quizQs} quiz questions, and {aiGenResult.flashcards} flashcards.
                      </p>
                    </div>
                  </div>
                )}

                {/* AI Error Result Box */}
                {aiGenError && (
                  <div className="rounded-xl p-5 flex items-start gap-4 bg-danger/10 border border-danger/30">
                    <AlertTriangle size={20} className="text-danger shrink-0" />
                    <div>
                      <p className="font-semibold text-sm text-danger">AI generation failed</p>
                      <p className="text-xs text-muted mt-1">{aiGenError}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* --- Dialog Modals --- */}

      {/* 1. Course Dialog */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setShowCourseModal(false)} />
          <div className="relative card-base p-6 max-w-md w-full flex flex-col gap-4 z-10 bg-surface">
            <h3 className="font-bold text-ink text-lg">{courseId ? 'Edit Course' : 'New Course'}</h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-eyebrow text-muted">Course Title</label>
              <input className="input-base" placeholder="Survival Hebrew" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-eyebrow text-muted">Description</label>
              <textarea
                className="input-base"
                style={{ height: 80, resize: 'none', padding: '8px 12px' }}
                placeholder="What will students learn?"
                value={courseDesc}
                onChange={(e) => setCourseDesc(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-eyebrow text-muted">Level</label>
                <select className="input-base" value={courseLevel} onChange={(e) => setCourseLevel(e.target.value)} style={{ appearance: 'none' }}>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-eyebrow text-muted">Status</label>
                <select className="input-base" value={courseStatus} onChange={(e) => setCourseStatus(e.target.value as 'DRAFT' | 'PUBLISHED')} style={{ appearance: 'none' }}>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-eyebrow text-muted">Cover Color (HEX)</label>
              <div className="flex gap-2">
                <input className="input-base flex-1" placeholder="#3d6b65" value={courseColor} onChange={(e) => setCourseColor(e.target.value)} />
                <div className="w-11 h-11 rounded-xl border shrink-0" style={{ backgroundColor: courseColor }} />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button className="btn-outline text-sm h-9 px-4" onClick={() => setShowCourseModal(false)}>Cancel</button>
              <button className="btn-primary text-sm h-9 px-4" onClick={handleSaveCourse} disabled={!courseTitle.trim() || isPending}>
                {courseId ? 'Save Changes' : 'Create Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Course Delete Confirm */}
      {showCourseDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setShowCourseDeleteConfirm(null)} />
          <div className="relative card-base p-6 max-w-sm w-full flex flex-col gap-4 z-10 bg-surface">
            <h3 className="font-bold text-ink text-lg text-danger-color">Delete course?</h3>
            <p className="text-sm text-muted">All modules, lessons, and records will be permanently removed. This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button className="btn-outline text-sm h-9 px-4" onClick={() => setShowCourseDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger text-sm h-9 px-4" onClick={() => handleDeleteCourse(showCourseDeleteConfirm)} disabled={isPending}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Student Dialog */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setShowStudentModal(false)} />
          <div className="relative card-base p-6 max-w-sm w-full flex flex-col gap-4 z-10 bg-surface">
            <h3 className="font-bold text-ink text-lg">{studentId ? 'Edit Student Details' : 'New Student'}</h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-eyebrow text-muted">Full Name</label>
              <input className="input-base" placeholder="Aarati Sharma" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-eyebrow text-muted">Email address</label>
              <input className="input-base" type="email" placeholder="aarati@demo.test" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-eyebrow text-muted">{studentId ? 'Change Password (optional)' : 'Password'}</label>
              <input className="input-base" type="password" placeholder={studentId ? '••••••••' : 'Password'} value={studentPw} onChange={(e) => setStudentPw(e.target.value)} />
            </div>
            <div className="flex gap-3 justify-end">
              <button className="btn-outline text-sm h-9 px-4" onClick={() => setShowStudentModal(false)}>Cancel</button>
              <button className="btn-primary text-sm h-9 px-4" onClick={handleSaveStudent} disabled={!studentName.trim() || !studentEmail.trim() || (!studentId && !studentPw) || isPending}>
                {studentId ? 'Save' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Student Delete Confirm */}
      {showStudentDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setShowStudentDeleteConfirm(null)} />
          <div className="relative card-base p-6 max-w-sm w-full flex flex-col gap-4 z-10 bg-surface">
            <h3 className="font-bold text-ink text-lg text-danger-color">Delete Student?</h3>
            <p className="text-sm text-muted">This removes access and resets streaks. This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button className="btn-outline text-sm h-9 px-4" onClick={() => setShowStudentDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger text-sm h-9 px-4" onClick={() => handleDeleteStudent(showStudentDeleteConfirm)} disabled={isPending}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Student Bulk Add Modal */}
      {showBulkAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setShowBulkAddModal(false)} />
          <div className="relative card-base p-6 max-w-lg w-full flex flex-col gap-4 z-10 bg-surface">
            <h3 className="font-bold text-ink text-lg">Bulk add students</h3>
            <p className="text-xs text-muted">
              Paste CSV records, one student per line. Format: <code className="bg-secondary px-1.5 py-0.5 rounded text-[10px] font-mono">name,email,password</code>
            </p>
            <textarea
              className="input-base font-mono text-xs"
              style={{ height: 160, resize: 'vertical', padding: '10px' }}
              placeholder="Aarati Sharma,aarati@demo.test,password123&#10;Binod Thapa,binod@demo.test,password123"
              value={bulkCsv}
              onChange={(e) => setBulkCsv(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button className="btn-outline text-sm h-9 px-4" onClick={() => setShowBulkAddModal(false)}>Cancel</button>
              <button className="btn-primary text-sm h-9 px-4" onClick={handleBulkAdd} disabled={!bulkCsv.trim() || isPending}>Import</button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Scenario Dialog */}
      {showScenarioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setShowScenarioModal(false)} />
          <div className="relative card-base p-6 max-w-md w-full flex flex-col gap-4 z-10 bg-surface">
            <h3 className="font-bold text-ink text-lg">{scenarioId ? 'Edit Scenario' : 'New Scenario'}</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-eyebrow text-muted">Title</label>
                <input className="input-base" placeholder="At the pharmacy" value={scenarioTitle} onChange={(e) => setScenarioTitle(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-eyebrow text-muted">Emoji Icon</label>
                <input className="input-base text-center text-xl" placeholder="💊" value={scenarioIcon} onChange={(e) => setScenarioIcon(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-eyebrow text-muted">Description</label>
              <input className="input-base" placeholder="Describe the roleplay situation..." value={scenarioDesc} onChange={(e) => setScenarioDesc(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-eyebrow text-muted">Setting Description (Visible context)</label>
              <input className="input-base" placeholder="e.g. Buying medicine at Super-Pharm..." value={scenarioSetting} onChange={(e) => setScenarioSetting(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-eyebrow text-muted">AI Role System Prompt</label>
              <textarea
                className="input-base font-mono text-xs"
                style={{ height: 80, resize: 'none', padding: '8px' }}
                placeholder="Instructions for the AI partner..."
                value={scenarioRolePrompt}
                onChange={(e) => setScenarioRolePrompt(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-eyebrow text-muted">Level</label>
                <select className="input-base" value={scenarioLevel} onChange={(e) => setScenarioLevel(e.target.value)} style={{ appearance: 'none' }}>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-eyebrow text-muted">Status</label>
                <select className="input-base" value={scenarioStatus} onChange={(e) => setScenarioStatus(e.target.value as 'DRAFT' | 'PUBLISHED')} style={{ appearance: 'none' }}>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button className="btn-outline text-sm h-9 px-4" onClick={() => setShowScenarioModal(false)}>Cancel</button>
              <button className="btn-primary text-sm h-9 px-4" onClick={handleSaveScenario} disabled={!scenarioTitle.trim() || !scenarioRolePrompt.trim() || isPending}>
                {scenarioId ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Scenario Delete Confirm */}
      {showScenarioDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setShowScenarioDeleteConfirm(null)} />
          <div className="relative card-base p-6 max-w-sm w-full flex flex-col gap-4 z-10 bg-surface">
            <h3 className="font-bold text-ink text-lg text-danger-color">Delete Scenario?</h3>
            <p className="text-sm text-muted">All phrases and learner chats will be permanently removed. This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button className="btn-outline text-sm h-9 px-4" onClick={() => setShowScenarioDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger text-sm h-9 px-4" onClick={() => handleDeleteScenario(showScenarioDeleteConfirm)} disabled={isPending}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
