import { create } from 'zustand'
import { UserProfile, CharacterType, ScenarioResult, Mission, TreeHolePost, Reply, ScenarioChoiceDetail } from '@/types'
import { treeHolePosts } from '@/data/treeHolePosts'
import { scenarios } from '@/data/scenarios'

function calculateStarRating(ratio: number): number {
  if (ratio >= 0.8) return 3
  if (ratio >= 0.5) return 2
  return 1
}

function computeScenarioStats(
  scenarioId: string,
  choices: { sceneId: string; optionId: string }[]
) {
  const scenario = scenarios.find((s) => s.id === scenarioId)
  if (!scenario) {
    return { recommendedCount: 0, totalChoices: choices.length, recommendedRatio: 0, starRating: 1 }
  }
  let recommendedCount = 0
  choices.forEach((choice) => {
    const scene = scenario.scenes.find((s) => s.id === choice.sceneId)
    if (!scene) return
    const option = scene.options.find((o) => o.id === choice.optionId)
    if (option?.isRecommended) {
      recommendedCount++
    }
  })
  const totalChoices = choices.length
  const recommendedRatio = totalChoices > 0 ? recommendedCount / totalChoices : 0
  const starRating = calculateStarRating(recommendedRatio)
  return { recommendedCount, totalChoices, recommendedRatio, starRating }
}

function buildChoiceDetails(
  scenarioId: string,
  choices: { sceneId: string; optionId: string }[]
): ScenarioChoiceDetail[] {
  const scenario = scenarios.find((s) => s.id === scenarioId)
  if (!scenario) return []
  return choices.map((choice) => {
    const scene = scenario.scenes.find((s) => s.id === choice.sceneId)
    const option = scene?.options.find((o) => o.id === choice.optionId)
    return {
      sceneId: choice.sceneId,
      sceneNarration: scene?.narration ?? '',
      optionId: choice.optionId,
      optionText: option?.text ?? '',
      isRecommended: option?.isRecommended ?? false,
      feedback: option?.feedback ?? '',
      consequence: option?.consequence ?? '',
    }
  })
}

const STORAGE_KEY = 'dad-adventure-state'

function getTitleByLevel(level: number): string {
  if (level <= 2) return '初出茅庐的爸爸'
  if (level <= 4) return '渐入佳境的爸爸'
  if (level <= 6) return '得心应手的爸爸'
  return '传说中的超级爸爸'
}

function saveToLocalStorage(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

function loadFromLocalStorage(): GameState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch {
    // ignore
  }
  return null
}

interface GameState {
  userProfile: UserProfile | null
  scenarioResults: ScenarioResult[]
  missions: Mission[]
  posts: TreeHolePost[]
  hasProgressStar: boolean
}

interface GameActions {
  createProfile: (characterType: CharacterType, nickname: string) => void
  completeScenario: (scenarioId: string, choices: { sceneId: string; optionId: string }[]) => { isProgress: boolean; previousResult: ScenarioResult | null; newResult: ScenarioResult }
  unlockSkill: (skillId: string) => void
  toggleMission: (missionId: string) => void
  addMission: (mission: Mission) => void
  removeMission: (missionId: string) => void
  addPost: (post: TreeHolePost) => void
  addReplyToPost: (postId: string, reply: Reply) => void
  togglePostLike: (postId: string) => void
  resetGame: () => void
  getResultsForScenario: (scenarioId: string) => ScenarioResult[]
  getLastResultForScenario: (scenarioId: string) => ScenarioResult | null
  getChoiceDetailsForResult: (result: ScenarioResult) => ScenarioChoiceDetail[]
  setProgressStar: (value: boolean) => void
  clearProgressStar: () => void
}

type StoreType = GameState & GameActions

const savedState = loadFromLocalStorage()

export const useGameStore = create<StoreType>()((set, get) => ({
  userProfile: savedState?.userProfile ?? null,
  scenarioResults: savedState?.scenarioResults ?? [],
  missions: savedState?.missions ?? [],
  posts: savedState?.posts ?? treeHolePosts,
  hasProgressStar: savedState?.hasProgressStar ?? false,

  createProfile: (characterType, nickname) => {
    const profile: UserProfile = {
      id: crypto.randomUUID(),
      characterType,
      nickname,
      level: 1,
      title: '初出茅庐的爸爸',
      createdAt: new Date().toISOString(),
      completedScenarios: [],
      unlockedSkills: [],
      completedMissions: [],
      earnedBadges: [],
    }
    set({ userProfile: profile })
    saveToLocalStorage(get())
  },

  completeScenario: (scenarioId, choices) => {
    const state = get()
    if (!state.userProfile) {
      const emptyResult: ScenarioResult = {
        scenarioId,
        choices,
        completedAt: new Date().toISOString(),
        playIndex: 0,
        recommendedCount: 0,
        totalChoices: 0,
        recommendedRatio: 0,
        starRating: 1,
      }
      return { isProgress: false, previousResult: null, newResult: emptyResult }
    }

    const existingResults = state.scenarioResults.filter((r) => r.scenarioId === scenarioId)
    const playIndex = existingResults.length + 1
    const stats = computeScenarioStats(scenarioId, choices)
    const previousResult = existingResults.length > 0 ? existingResults[existingResults.length - 1] : null

    const result: ScenarioResult = {
      scenarioId,
      choices,
      completedAt: new Date().toISOString(),
      playIndex,
      ...stats,
    }

    const isProgress = previousResult !== null && result.recommendedRatio > previousResult.recommendedRatio

    const newLevel = state.userProfile.level + 1
    const newTitle = getTitleByLevel(newLevel)
    const alreadyCompleted = state.userProfile.completedScenarios.includes(scenarioId)

    set({
      scenarioResults: [...state.scenarioResults, result],
      hasProgressStar: isProgress ? true : state.hasProgressStar,
      userProfile: {
        ...state.userProfile,
        level: newLevel,
        title: newTitle,
        completedScenarios: alreadyCompleted
          ? state.userProfile.completedScenarios
          : [...state.userProfile.completedScenarios, scenarioId],
      },
    })
    saveToLocalStorage(get())

    return { isProgress, previousResult, newResult: result }
  },

  unlockSkill: (skillId) => {
    const state = get()
    if (!state.userProfile) return

    const newLevel = state.userProfile.level + 1
    const newTitle = getTitleByLevel(newLevel)

    set({
      userProfile: {
        ...state.userProfile,
        level: newLevel,
        title: newTitle,
        unlockedSkills: [...state.userProfile.unlockedSkills, skillId],
        earnedBadges: [...state.userProfile.earnedBadges, `${skillId}-badge`],
      },
    })
    saveToLocalStorage(get())
  },

  toggleMission: (missionId) => {
    const state = get()
    const mission = state.missions.find((m) => m.id === missionId)
    if (!mission) return

    const willBeCompleted = !mission.completed
    let newCompletedMissions = [...(state.userProfile?.completedMissions ?? [])]

    if (willBeCompleted) {
      if (!newCompletedMissions.includes(missionId)) {
        newCompletedMissions.push(missionId)
      }
    } else {
      newCompletedMissions = newCompletedMissions.filter((id) => id !== missionId)
    }

    let newProfile = state.userProfile
    if (state.userProfile) {
      newProfile = {
        ...state.userProfile,
        completedMissions: newCompletedMissions,
      }
    }

    set({
      missions: state.missions.map((m) =>
        m.id === missionId ? { ...m, completed: !m.completed } : m
      ),
      userProfile: newProfile,
    })
    saveToLocalStorage(get())
  },

  addMission: (mission) => {
    const state = get()
    set({ missions: [...state.missions, mission] })
    saveToLocalStorage(get())
  },

  removeMission: (missionId) => {
    const state = get()

    let newProfile = state.userProfile
    if (state.userProfile) {
      newProfile = {
        ...state.userProfile,
        completedMissions: state.userProfile.completedMissions.filter(
          (id) => id !== missionId
        ),
      }
    }

    set({
      missions: state.missions.filter((m) => m.id !== missionId),
      userProfile: newProfile,
    })
    saveToLocalStorage(get())
  },

  addPost: (post) => {
    const state = get()
    set({ posts: [post, ...state.posts] })
    saveToLocalStorage(get())
  },

  addReplyToPost: (postId, reply) => {
    const state = get()
    set({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, replies: [...p.replies, reply] } : p
      ),
    })
    saveToLocalStorage(get())
  },

  togglePostLike: (postId) => {
    const state = get()
    set({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, likes: p.likes + 1 } : p
      ),
    })
    saveToLocalStorage(get())
  },

  resetGame: () => {
    set({
      userProfile: null,
      scenarioResults: [],
      missions: [],
      posts: treeHolePosts,
      hasProgressStar: false,
    })
    localStorage.removeItem(STORAGE_KEY)
  },

  getResultsForScenario: (scenarioId) => {
    const state = get()
    return state.scenarioResults.filter((r) => r.scenarioId === scenarioId)
  },

  getLastResultForScenario: (scenarioId) => {
    const state = get()
    const results = state.scenarioResults.filter((r) => r.scenarioId === scenarioId)
    return results.length > 0 ? results[results.length - 1] : null
  },

  getChoiceDetailsForResult: (result) => {
    return buildChoiceDetails(result.scenarioId, result.choices)
  },

  setProgressStar: (value) => {
    set({ hasProgressStar: value })
    saveToLocalStorage(get())
  },

  clearProgressStar: () => {
    set({ hasProgressStar: false })
    saveToLocalStorage(get())
  },
}))
