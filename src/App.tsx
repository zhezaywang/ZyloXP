import {
  ArrowRight,
  BatteryCharging,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  GraduationCap,
  Heart,
  Menu,
  Search,
  Settings,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  bankSignals,
  careerTracks,
  labScenarios,
  lessonQuestion,
  navigation,
  skillNodes,
  stats,
} from './data';
import type { AppSection, SkillNode } from './data';

const sectionTitles: Record<AppSection, string> = {
  learn: 'Electrical Engineering Foundations',
  practice: 'Practice Session',
  labs: 'Circuit Labs',
  careers: 'Career Map',
  bank: 'Question Bank',
};

const skillStatusClass: Record<SkillNode['status'], string> = {
  Current: 'statusCurrent',
  Unlocked: 'statusUnlocked',
  Locked: 'statusLocked',
};

function App() {
  const [activeSection, setActiveSection] = useState<AppSection>('learn');
  const [activeSkillId, setActiveSkillId] = useState(skillNodes[0].id);
  const [query, setQuery] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [voltage, setVoltage] = useState(5);
  const [resistance, setResistance] = useState(10);

  const activeSkill = skillNodes.find((skill) => skill.id === activeSkillId) ?? skillNodes[0];
  const current = voltage / resistance;
  const isCorrect = selectedOption === lessonQuestion.correctIndex;

  const filteredSkills = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return skillNodes;
    }

    return skillNodes.filter((skill) => {
      return [skill.title, skill.unit, skill.careerSignal]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [query]);

  function handleAnswer(optionIndex: number) {
    setSelectedOption(optionIndex);
  }

  return (
    <div className="appShell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brandLockup">
          <div className="brandMark">
            <BatteryCharging size={20} strokeWidth={2.4} />
          </div>
          <div>
            <strong>ZyloXP</strong>
            <span>Tech career academy</span>
          </div>
        </div>

        <nav className="navList">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                className={`navButton ${isActive ? 'active' : ''}`}
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                title={item.label}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="profilePanel">
          <div className="avatar">ZW</div>
          <div>
            <strong>Level 4</strong>
            <span>EE Foundations</span>
          </div>
        </div>

        <div className="sidebarFooter">
          <button className="iconButton ghost" title="Help" type="button">
            <CircleHelp size={18} />
          </button>
          <button className="iconButton ghost" title="Settings" type="button">
            <Settings size={18} />
          </button>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <button className="iconButton mobileOnly" title="Open menu" type="button">
            <Menu size={20} />
          </button>

          <label className="searchBox">
            <Search size={18} />
            <input
              aria-label="Search lessons"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search lessons, labs, careers"
              type="search"
              value={query}
            />
          </label>

          <div className="topbarActions">
            <div className="heartGroup" aria-label="Hearts remaining">
              {[0, 1, 2, 3].map((heart) => (
                <Heart fill="currentColor" key={heart} size={16} />
              ))}
              <Heart key="empty" size={16} />
            </div>
            <button className="iconButton" title="Notifications" type="button">
              <Bell size={18} />
            </button>
            <button className="primaryButton" onClick={() => setActiveSection('practice')} type="button">
              Start Lesson
              <ArrowRight size={18} />
            </button>
          </div>
        </header>

        <section className="heroBand" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">ZyloXP / EE First Track</p>
            <h1 id="page-title">{sectionTitles[activeSection]}</h1>
            <p>
              Bite-size electrical engineering practice with circuit diagrams, XP, labs, and
              career-linked skill progress.
            </p>
          </div>

          <div className="streakCard">
            <span>Today</span>
            <strong>12 min</strong>
            <small>Goal: 20 min</small>
            <div className="miniProgress">
              <span style={{ width: '60%' }} />
            </div>
          </div>
        </section>

        <nav className="sectionTabs" aria-label="Workspace sections">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                className={isActive ? 'active' : ''}
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                type="button"
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <section className="statGrid" aria-label="Learner stats">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article className={`statCard ${stat.accent}`} key={stat.label}>
                <div className="statIcon">
                  <Icon size={19} />
                </div>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <small>{stat.note}</small>
              </article>
            );
          })}
        </section>

        <div className="contentGrid">
          <section className="mainColumn" aria-label="Primary content">
            {(activeSection === 'learn' || activeSection === 'practice') && (
              <>
                <div className="sectionHeader">
                  <div>
                    <p className="eyebrow">Skill Path</p>
                    <h2>From circuit intuition to career fluency</h2>
                  </div>
                  <span className="bankBadge">250,000 verified prompts</span>
                </div>

                <div className="pathList">
                  {filteredSkills.map((skill) => {
                    const Icon = skill.icon;
                    const isActive = activeSkill.id === skill.id;

                    return (
                      <button
                        className={`skillRow ${isActive ? 'selected' : ''}`}
                        key={skill.id}
                        onClick={() => setActiveSkillId(skill.id)}
                        type="button"
                      >
                        <div className="skillIcon">
                          <Icon size={20} />
                        </div>
                        <div className="skillBody">
                          <div className="skillTitleLine">
                            <span>{skill.unit}</span>
                            <strong>{skill.title}</strong>
                            <em className={skillStatusClass[skill.status]}>{skill.status}</em>
                          </div>
                          <p>{skill.careerSignal}</p>
                          <div className="progressLine">
                            <span style={{ width: `${skill.progress}%` }} />
                          </div>
                        </div>
                        <div className="skillMeta">
                          <strong>{skill.progress}%</strong>
                          <span>Level {skill.difficulty}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {(activeSection === 'learn' || activeSection === 'labs') && (
              <section className="labPanel" aria-label="Ohm's law lab">
                <div className="sectionHeader">
                  <div>
                    <p className="eyebrow">Lab Mode</p>
                    <h2>Ohm's Law Bench</h2>
                  </div>
                  <span className="bankBadge">Live calculation</span>
                </div>

                <div className="labGrid">
                  <img src={lessonQuestion.diagram} alt="Ohm's law circuit diagram" />
                  <div className="labControls">
                    <label>
                      <span>Voltage</span>
                      <strong>{voltage} V</strong>
                      <input
                        max="24"
                        min="1"
                        onChange={(event) => setVoltage(Number(event.target.value))}
                        type="range"
                        value={voltage}
                      />
                    </label>
                    <label>
                      <span>Resistance</span>
                      <strong>{resistance} ohm</strong>
                      <input
                        max="48"
                        min="1"
                        onChange={(event) => setResistance(Number(event.target.value))}
                        type="range"
                        value={resistance}
                      />
                    </label>
                    <div className="resultBox">
                      <span>Current</span>
                      <strong>{current.toFixed(2)} A</strong>
                      <small>I = V / R</small>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {(activeSection === 'labs' || activeSection === 'learn') && (
              <div className="labCards" aria-label="Available labs">
                {labScenarios.map((lab) => (
                  <article className="labCard" key={lab.id}>
                    <img src={lab.diagram} alt={`${lab.title} diagram`} />
                    <div>
                      <span>{lab.topic}</span>
                      <h3>{lab.title}</h3>
                      <p>{lab.metric}: {lab.result}</p>
                    </div>
                    <em>{lab.status}</em>
                  </article>
                ))}
              </div>
            )}

            {activeSection === 'careers' && (
              <section className="careerGrid" aria-label="Career tracks">
                {careerTracks.map((track) => (
                  <article className="careerCard" key={track.role}>
                    <div className="matchDial">
                      <GraduationCap size={20} />
                      <strong>{track.match}%</strong>
                    </div>
                    <div>
                      <h3>{track.role}</h3>
                      <p>{track.focus}</p>
                    </div>
                    <div className="chipRow">
                      {track.skills.map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))}
                    </div>
                    <footer>
                      {track.nextStep}
                      <ChevronRight size={16} />
                    </footer>
                  </article>
                ))}
              </section>
            )}

            {activeSection === 'bank' && (
              <section className="bankPanel" aria-label="Question bank status">
                <div className="sectionHeader">
                  <div>
                    <p className="eyebrow">App Content System</p>
                    <h2>Electrical engineering question bank</h2>
                  </div>
                  <span className="bankBadge">Import-ready</span>
                </div>

                <div className="bankGrid">
                  {bankSignals.map((signal) => (
                    <article className="bankSignal" key={signal.label}>
                      <span>{signal.label}</span>
                      <strong>{signal.value}</strong>
                      <p>{signal.detail}</p>
                    </article>
                  ))}
                </div>

                <div className="importPanel">
                  <DatabaseIcon />
                  <div>
                    <h3>Question schema</h3>
                    <p>
                      Topic, subtopic, difficulty rank, six options, answer key, explanation,
                      verification status, diagram ID, and asset path.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </section>

          <aside className="lessonPanel" aria-label="Lesson player">
            <div className="lessonHeader">
              <div>
                <p className="eyebrow">Current Lesson</p>
                <h2>{lessonQuestion.topic}</h2>
              </div>
              <span>+{lessonQuestion.xp} XP</span>
            </div>

            <img className="lessonDiagram" src={lessonQuestion.diagram} alt="Circuit diagram for lesson" />

            <div className="questionBlock">
              <span>Difficulty {lessonQuestion.difficulty}/10</span>
              <h3>{lessonQuestion.prompt}</h3>
            </div>

            <div className="optionGrid">
              {lessonQuestion.options.map((option, optionIndex) => {
                const wasSelected = selectedOption === optionIndex;
                const isAnswer = optionIndex === lessonQuestion.correctIndex;
                const showCorrect = selectedOption !== null && isAnswer;
                const showWrong = wasSelected && !isAnswer;

                return (
                  <button
                    className={`answerButton ${showCorrect ? 'correct' : ''} ${showWrong ? 'wrong' : ''}`}
                    key={option}
                    onClick={() => handleAnswer(optionIndex)}
                    type="button"
                  >
                    <span>{String.fromCharCode(65 + optionIndex)}</span>
                    {option}
                  </button>
                );
              })}
            </div>

            {selectedOption !== null && (
              <div className={`feedbackBox ${isCorrect ? 'success' : 'error'}`}>
                {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                <div>
                  <strong>{isCorrect ? 'Correct' : 'Review the relationship'}</strong>
                  <p>{lessonQuestion.explanation}</p>
                  <small>{lessonQuestion.careerContext}</small>
                </div>
              </div>
            )}

            <button className="primaryButton fullWidth" onClick={() => setSelectedOption(null)} type="button">
              Next Prompt
              <ArrowRight size={18} />
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
}

function DatabaseIcon() {
  return (
    <div className="databaseIcon" aria-hidden="true">
      <span />
      <span />
      <span />
      <Check size={16} />
    </div>
  );
}

export default App;
