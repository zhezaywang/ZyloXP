import type { AppSection } from './data';

export type AppPage =
  | 'overview'
  | 'concept'
  | 'game'
  | 'lesson'
  | 'lab'
  | 'career'
  | 'career-project'
  | 'portfolio'
  | 'workbench'
  | 'progress'
  | 'insights'
  | 'focus-room'
  | 'review-plan'
  | 'mistake-lab'
  | 'checkpoint-exam'
  | 'skill-map'
  | 'study-route'
  | 'weekly-plan'
  | 'sprint-summary';

export type AppRoute = {
  page: AppPage;
  resourceId: string | null;
  section: AppSection;
};

const DEFAULT_ROUTE: AppRoute = {
  page: 'overview',
  resourceId: null,
  section: 'learn',
};

function decodeSegment(segment: string | undefined) {
  if (!segment) {
    return null;
  }

  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

export function parseAppHash(hash: string): AppRoute {
  const path = hash.replace(/^#\/?/, '');
  const segments = path.split('/').filter(Boolean);
  const [section, detail, resource] = segments;

  if (section === 'practice') {
    if (detail === 'question') {
      return {
        page: 'lesson',
        resourceId: decodeSegment(resource),
        section: 'practice',
      };
    }
    if (detail === 'review') {
      return { page: 'review-plan', resourceId: null, section: 'practice' };
    }
    if (detail === 'mistakes') {
      return { page: 'mistake-lab', resourceId: null, section: 'practice' };
    }
    if (detail === 'checkpoint') {
      return {
        page: 'checkpoint-exam',
        resourceId: null,
        section: 'practice',
      };
    }
    return { page: 'overview', resourceId: null, section: 'practice' };
  }

  if (section === 'labs') {
    if (detail === 'workbench') {
      return {
        page: 'workbench',
        resourceId: decodeSegment(resource),
        section: 'labs',
      };
    }
    return detail
      ? { page: 'lab', resourceId: decodeSegment(detail), section: 'labs' }
      : { page: 'overview', resourceId: null, section: 'labs' };
  }

  if (section === 'atlas') {
    if (detail === 'concept') {
      return {
        page: 'concept',
        resourceId: decodeSegment(resource),
        section: 'atlas',
      };
    }
    if (detail === 'game') {
      return {
        page: 'game',
        resourceId: decodeSegment(resource),
        section: 'atlas',
      };
    }
    return { page: 'overview', resourceId: null, section: 'atlas' };
  }

  if (section === 'careers') {
    const careerRole = decodeSegment(detail);
    if (!careerRole) {
      return { page: 'overview', resourceId: null, section: 'careers' };
    }
    if (resource === 'project') {
      return {
        page: 'career-project',
        resourceId: careerRole,
        section: 'careers',
      };
    }
    if (resource === 'portfolio') {
      return {
        page: 'portfolio',
        resourceId: careerRole,
        section: 'careers',
      };
    }
    return { page: 'career', resourceId: careerRole, section: 'careers' };
  }

  if (section === 'learn') {
    if (detail === 'focus') {
      return { page: 'focus-room', resourceId: null, section: 'learn' };
    }
    if (detail === 'skill-map') {
      return {
        page: 'skill-map',
        resourceId: decodeSegment(resource),
        section: 'learn',
      };
    }
    if (detail === 'route') {
      return { page: 'study-route', resourceId: null, section: 'learn' };
    }
    if (detail === 'week') {
      return { page: 'weekly-plan', resourceId: null, section: 'learn' };
    }
    return DEFAULT_ROUTE;
  }

  if (section === 'bank') {
    return { page: 'overview', resourceId: null, section: 'bank' };
  }

  if (section === 'notebook') {
    return { page: 'overview', resourceId: null, section: 'notebook' };
  }

  if (section === 'progress') {
    return detail === 'insights'
      ? { page: 'insights', resourceId: null, section: 'learn' }
      : { page: 'progress', resourceId: null, section: 'learn' };
  }

  return DEFAULT_ROUTE;
}

export function buildAppHash(route: AppRoute) {
  const resource = route.resourceId
    ? encodeURIComponent(route.resourceId)
    : '';

  switch (route.page) {
    case 'concept':
      return resource ? `#/atlas/concept/${resource}` : '#/atlas';
    case 'game':
      return resource ? `#/atlas/game/${resource}` : '#/atlas';
    case 'lesson':
      return resource ? `#/practice/question/${resource}` : '#/practice';
    case 'review-plan':
      return '#/practice/review';
    case 'mistake-lab':
      return '#/practice/mistakes';
    case 'checkpoint-exam':
      return '#/practice/checkpoint';
    case 'lab':
      return resource ? `#/labs/${resource}` : '#/labs';
    case 'workbench':
      return resource ? `#/labs/workbench/${resource}` : '#/labs/workbench';
    case 'career':
      return resource ? `#/careers/${resource}` : '#/careers';
    case 'career-project':
      return resource
        ? `#/careers/${resource}/project`
        : '#/careers';
    case 'portfolio':
      return resource
        ? `#/careers/${resource}/portfolio`
        : '#/careers';
    case 'progress':
      return '#/progress';
    case 'insights':
      return '#/progress/insights';
    case 'focus-room':
      return '#/learn/focus';
    case 'skill-map':
      return resource ? `#/learn/skill-map/${resource}` : '#/learn/skill-map';
    case 'study-route':
      return '#/learn/route';
    case 'weekly-plan':
      return '#/learn/week';
    case 'sprint-summary':
      return '#/practice';
    case 'overview':
      return `#/${route.section}`;
  }
}
