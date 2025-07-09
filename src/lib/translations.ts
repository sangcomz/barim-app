export const translations = {
  ko: {
    // Header
    greeting: "님, 안녕하세요!",
    logout: "로그아웃",
    selectProject: "-- 프로젝트 선택 --",
    tasksAndNotes: "개 작업 / {notes}개 노트",
    
    // Landing Page
    tagline: "GitHub Issues를 활용한 스마트한 프로젝트 관리 도구",
    barimDescription: "적바림은 나중에 참고하기 위해 글로 간단히 적어 두는 것을 뜻하는 순우리말입니다.",
    barimMeaning: "Barim은 이 아름다운 우리말에서 이름을 따온 현대적인 작업 관리 도구입니다.",
    startWithGithub: "GitHub으로 시작하기",
    
    // Features
    kanbanBoard: "칸반 보드",
    kanbanDescription: "TODO, IN PROGRESS, DONE, PENDING 상태로 작업을 시각적으로 관리하고 원클릭으로 쉽게 상태를 변경할 수 있습니다.",
    noteFeature: "노트 기능",
    noteDescription: "프로젝트별로 노트를 정리하고 아이디어를 기록하여 체계적인 지식 관리가 가능합니다.",
    
    // Why Barim
    whyBarim: "왜 Barim인가요?",
    fastSync: "빠른 동기화",
    fastSyncDescription: "GitHub Issues와 실시간 동기화로 언제 어디서든 최신 상태 유지",
    secureManagement: "안전한 관리",
    secureDescription: "GitHub OAuth 인증으로 안전하고 신뢰할 수 있는 데이터 보호",
    ideIntegration: "IDE 플러그인 연동",
    ideDescription: "IntelliJ, VSCode 등 주요 IDE 플러그인과 연동하여 개발 환경에서 바로 작업 관리",
    
    // Kanban States
    todo: "TODO",
    inProgress: "IN PROGRESS",
    done: "DONE",
    pending: "PENDING",
    
    // Empty States
    noTasks: "할 일이 없습니다",
    noInProgress: "진행 중인 작업이 없습니다",
    noDone: "완료된 작업이 없습니다",
    noPending: "보류된 작업이 없습니다",
    noNotes: "등록된 노트가 없습니다",
    
    // Actions
    start: "시작",
    complete: "완료",
    hold: "보류",
    restart: "재시작",
    edit: "편집",
    delete: "삭제",
    createNewItem: "새 항목 생성",
    addProject: "프로젝트 추가",
    
    editCard: "카드 편집",
    pendingReason: "보류 사유",
    cancel: "취소",
    save: "저장",
    confirm: "확인",
    
    // Form Fields
    type: "타입",
    task: "Task",
    note: "Note",
    title: "제목",
    titlePlaceholder: "제목을 입력하세요",
    content: "상세 내용",
    contentPlaceholder: "상세 내용 (선택사항)",
    contentRequired: "상세 내용",
    tags: "태그",
    tagsPlaceholder: "태그를 쉼표로 구분하여 입력하세요",
    tagsHelp: "tag:태그명 형태의 라벨로 추가됩니다.",
    pendingReasonPlaceholder: "보류하는 이유를 입력하세요...",
    createTask: "Task 생성",
    createNote: "Note 생성",
    
    // Validation
    titleRequired: "제목을 입력해주세요.",
    projectRequired: "프로젝트를 선택해주세요.",
    projectNameRequired: "프로젝트 이름을 입력해주세요.",
    
    // Project Management
    projectSource: "프로젝트 생성 방법",
    fromRepository: "레포지토리에서",
    customName: "직접 입력",
    selectRepository: "레포지토리 선택",
    repositoryHelp: "기존 레포지토리 이름을 프로젝트로 사용합니다.",
    projectName: "프로젝트 이름",
    projectNamePlaceholder: "프로젝트 이름을 입력하세요",
    projectNameHelp: "영문, 숫자, 하이픈(-), 언더스코어(_)만 사용 가능합니다.",
    description: "설명",
    optional: "선택사항",
    projectDescriptionPlaceholder: "프로젝트 설명을 입력하세요",
    
    // Loading States
    creating: "생성 중...",
    updating: "수정 중...",
    processing: "처리 중...",
    loading: "로딩",
    loadMore: "더 보기",
    
    // Errors
    error: "에러",
    
    // Notes
    notes: "노트",
    
    // Footer
    reportIssue: "Report Issue",
    
    // Theme
    lightMode: "라이트 모드로 변경",
    darkMode: "다크 모드로 변경",
    lightModeShort: "라이트 모드",
    darkModeShort: "다크 모드",
    
    // GitHub App Install
    githubAppInstallRequired: "GitHub App 설치가 필요합니다",
    whyGithubAppInstall: "왜 GitHub App 설치가 필요한가요?",
    reasonSafeManagement: "barim-data 레포지토리의 이슈를 안전하게 관리하기 위해",
    reasonMinimalPermissions: "최소한의 권한만 요청하여 보안을 강화",
    reasonStableAccess: "더 안정적이고 빠른 API 접근을 위해",
    createBarimDataRepo: "barim-data 레포지토리 생성",
    createBarimDataDescription: "개인 작업 공간으로 사용할 private 레포지토리를 생성합니다.",
    installGithubApp: "GitHub App 설치",
    installGithubAppDescription: "barim-data 레포지토리에 대한 이슈 읽기/쓰기 권한만 부여합니다.",
    minimalPermissionsTitle: "최소 권한 요청 이유:",
    issueReadPermission: "이슈 읽기: 작업 목록을 불러오기 위해",
    issueWritePermission: "이슈 쓰기: 작업 상태를 업데이트하기 위해",
    noCodeAccess: "코드나 다른 데이터에는 접근하지 않습니다",
    refreshAfterInstall: "GitHub App 설치 후 페이지를 새로고침하면 Barim을 사용할 수 있습니다.",
    installLater: "나중에 설치하기",
    creatingRepo: "레포지토리 생성 중...",
    repoCreated: "barim-data 레포지토리가 생성되었습니다!",
    repoCreationFailed: "레포지토리 생성에 실패했습니다. 다시 시도해 주세요.",
  },
  
  en: {
    // Header
    greeting: ", Welcome!",
    logout: "Logout",
    selectProject: "-- Select Project --",
    tasksAndNotes: " tasks / {notes} notes",
    
    // Landing Page
    tagline: "Smart project management tool using GitHub Issues",
    barimDescription: "'Jeokbarim' is a Korean word meaning to briefly write something down for future reference.",
    barimMeaning: "Barim is a modern task management tool named after this beautiful Korean word.",
    startWithGithub: "Start with GitHub",
    
    // Features
    kanbanBoard: "Kanban Board",
    kanbanDescription: "Visually manage tasks with TODO, IN PROGRESS, DONE, PENDING states and easily change states with one click.",
    noteFeature: "Note Feature",
    noteDescription: "Organize notes by project and record ideas for systematic knowledge management.",
    
    // Why Barim
    whyBarim: "Why Barim?",
    fastSync: "Fast Synchronization",
    fastSyncDescription: "Real-time sync with GitHub Issues, stay up-to-date anywhere, anytime",
    secureManagement: "Secure Management",
    secureDescription: "Safe and reliable data protection with GitHub OAuth authentication",
    ideIntegration: "IDE Plugin Integration",
    ideDescription: "Integrate with major IDE plugins like IntelliJ, VSCode for direct task management in development environment",
    
    // Kanban States
    todo: "TODO",
    inProgress: "IN PROGRESS", 
    done: "DONE",
    pending: "PENDING",
    
    // Empty States
    noTasks: "No tasks available",
    noInProgress: "No tasks in progress",
    noDone: "No completed tasks",
    noPending: "No pending tasks",
    noNotes: "No notes registered",
    
    // Actions
    start: "Start",
    complete: "Complete",
    hold: "Hold",
    restart: "Restart",
    edit: "Edit",
    delete: "Delete",
    createNewItem: "Create New Item",
    addProject: "Add Project",
    
    editCard: "Edit Card",
    pendingReason: "Pending Reason",
    cancel: "Cancel",
    save: "Save",
    confirm: "Confirm",
    
    // Form Fields
    type: "Type",
    task: "Task",
    note: "Note",
    title: "Title",
    titlePlaceholder: "Enter title",
    content: "Details",
    contentPlaceholder: "Details (optional)",
    contentRequired: "Details",
    tags: "Tags",
    tagsPlaceholder: "Enter tags separated by commas",
    tagsHelp: "Will be added as labels in tag:tagname format.",
    pendingReasonPlaceholder: "Enter reason for holding...",
    createTask: "Create Task",
    createNote: "Create Note",
    
    // Validation
    titleRequired: "Please enter a title.",
    projectRequired: "Please select a project.",
    projectNameRequired: "Please enter a project name.",
    
    // Project Management
    projectSource: "Project Creation Method",
    fromRepository: "From Repository",
    customName: "Custom Name",
    selectRepository: "Select Repository",
    repositoryHelp: "Use existing repository name as project name.",
    projectName: "Project Name",
    projectNamePlaceholder: "Enter project name",
    projectNameHelp: "Only letters, numbers, hyphens(-), and underscores(_) are allowed.",
    description: "Description",
    optional: "optional",
    projectDescriptionPlaceholder: "Enter project description",
    
    // Loading States
    creating: "Creating...",
    updating: "Updating...",
    processing: "Processing...",
    loading: "Loading",
    loadMore: "Load More",
    
    // Errors
    error: "Error",
    
    // Notes
    notes: "Notes",
    
    // Footer
    reportIssue: "Report Issue",
    
    // Theme
    lightMode: "Switch to Light Mode",
    darkMode: "Switch to Dark Mode",
    lightModeShort: "Light Mode",
    darkModeShort: "Dark Mode",
    
    // GitHub App Install
    githubAppInstallRequired: "GitHub App Installation Required",
    whyGithubAppInstall: "Why is GitHub App installation required?",
    reasonSafeManagement: "To safely manage issues in the barim-data repository",
    reasonMinimalPermissions: "Enhanced security by requesting minimal permissions only",
    reasonStableAccess: "For more stable and faster API access",
    createBarimDataRepo: "Create barim-data Repository",
    createBarimDataDescription: "Create a private repository to use as your personal workspace.",
    installGithubApp: "Install GitHub App",
    installGithubAppDescription: "Grant only issue read/write permissions for the barim-data repository.",
    minimalPermissionsTitle: "Reasons for minimal permissions:",
    issueReadPermission: "Issue Read: To load task lists",
    issueWritePermission: "Issue Write: To update task status",
    noCodeAccess: "No access to code or other data",
    refreshAfterInstall: "You can use Barim after installing the GitHub App and refreshing the page.",
    installLater: "Install Later",
    creatingRepo: "Creating repository...",
    repoCreated: "barim-data repository has been created!",
    repoCreationFailed: "Failed to create repository. Please try again.",
  }
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.ko;
