import { useParams, useNavigate, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { Home, Theater, ArrowRight, ArrowUp, Sparkles, Lock } from "lucide-react"
import { scenarios } from "@/data/scenarios"
import { useGameStore } from "@/store/useGameStore"
import type { ScenarioResult, ScenarioChoiceDetail } from "@/types"
import { useMemo } from "react"

const tipsMap: Record<string, string> = {
  生理成长:
    "面对孩子的身体变化，保持平静和正面是最重要的。提前学习相关知识，准备好必要的物资，用平常心去面对。记住，你的态度决定了孩子的感受。",
  安全守护:
    "保护孩子安全的同时，也要教会她自我保护。倾听比追问更重要，行动比愤怒更有效。让孩子知道，无论发生什么，你永远是她最坚实的后盾。",
  情感成长:
    "青春期情绪波动是正常的生理和心理变化，不是孩子'不听话'。给她空间，也给她安全感。有时候最好的陪伴就是安静地坐在她身边。",
  情感引导:
    "尊重孩子的隐私和感受，是建立信任的基石。不要急于评判，先试着理解。用开放式的问题引导她思考，而不是直接告诉她答案。",
  学习成长:
    "每个孩子的学习节奏不同，重要的是找到适合她的方法。成绩不是衡量价值的唯一标准，帮助她建立正确的心态和习惯，比短期分数更重要。",
}

interface ReviewLocationState {
  choices: { sceneId: string; optionId: string }[]
  newResult?: ScenarioResult
  previousResult?: ScenarioResult | null
  isProgress?: boolean
  celebrationData?: {
    previousRatio: number
    newRatio: number
    previousStars: number
    newStars: number
  } | null
}

function getStatsForChoices(
  scenarioId: string,
  choices: { sceneId: string; optionId: string }[]
) {
  const scenario = scenarios.find((s) => s.id === scenarioId)
  if (!scenario) {
    return {
      recommendedCount: 0,
      totalChoices: choices.length,
      recommendedRatio: 0,
      starRating: 1,
    }
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
  const starRating =
    recommendedRatio >= 0.8 ? 3 : recommendedRatio >= 0.5 ? 2 : 1
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
      sceneNarration: scene?.narration ?? "",
      optionId: choice.optionId,
      optionText: option?.text ?? "",
      isRecommended: option?.isRecommended ?? false,
      feedback: option?.feedback ?? "",
      consequence: option?.consequence ?? "",
    }
  })
}

interface ResultCardProps {
  title: string
  result: {
    recommendedCount: number
    totalChoices: number
    recommendedRatio: number
    starRating: number
    playIndex?: number
  }
  details: ScenarioChoiceDetail[]
  variant?: "first" | "second" | "single"
  showBadge?: string
}

function ResultCard({ title, result, details, variant, showBadge }: ResultCardProps) {
  const borderColor =
    variant === "first"
      ? "border-adventure-blue/30"
      : variant === "second"
        ? "border-adventure-orange/30"
        : "border-gray-200"
  const headerGradient =
    variant === "second"
      ? "from-adventure-orange to-adventure-gold"
      : variant === "first"
        ? "from-adventure-blue to-adventure-blue-light"
        : "from-adventure-teal to-adventure-blue-light"

  return (
    <div className={`card-adventure !p-0 overflow-hidden border-2 ${borderColor}`}>
      <div
        className={`bg-gradient-to-r ${headerGradient} px-5 py-3 text-white`}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg flex items-center gap-2">
            {title}
            {showBadge && (
              <span className="bg-white/25 px-2 py-0.5 rounded-full text-xs">
                {showBadge}
              </span>
            )}
          </h3>
          {result.playIndex !== undefined && (
            <span className="text-xs font-body opacity-80">
              第{result.playIndex}次游玩
            </span>
          )}
        </div>
      </div>
      <div className="p-5">
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between font-body text-sm">
            <span className="text-adventure-blue/60">推荐选择</span>
            <span className="text-adventure-blue font-display">
              {result.recommendedCount} / {result.totalChoices}
            </span>
          </div>
          <div className="h-3 bg-adventure-blue/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(result.recommendedRatio * 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${
                variant === "second"
                  ? "bg-gradient-to-r from-adventure-orange to-adventure-gold"
                  : "bg-gradient-to-r from-adventure-teal to-adventure-blue"
              }`}
            />
          </div>
          <div className="flex items-center justify-between font-body text-sm">
            <span className="text-adventure-blue/60">推荐率</span>
            <span
              className={`font-display ${
                variant === "second"
                  ? "text-adventure-orange"
                  : "text-adventure-blue"
              }`}
            >
              {Math.round(result.recommendedRatio * 100)}%
            </span>
          </div>
          <div className="flex items-center justify-between font-body text-sm">
            <span className="text-adventure-blue/60">综合评价</span>
            <span className="text-adventure-gold">
              {"⭐".repeat(result.starRating)}
            </span>
          </div>
        </div>

        <div>
          <h4 className="font-display text-sm text-adventure-blue/70 mb-2">
            📝 选择路径
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {details.map((d, i) => (
              <div
                key={i}
                className={`rounded-lg border p-2 text-xs ${
                  d.isRecommended
                    ? "border-adventure-teal/30 bg-adventure-teal/5"
                    : "border-adventure-gold/30 bg-adventure-gold/5"
                }`}
              >
                <div className="flex items-start gap-2 mb-1">
                  <span className="font-display text-adventure-blue">
                    {i + 1}.
                  </span>
                  <span className="font-body text-adventure-blue truncate flex-1">
                    {d.optionText.length > 40
                      ? d.optionText.slice(0, 40) + "…"
                      : d.optionText}
                  </span>
                  <span
                    className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded ${
                    d.isRecommended
                      ? "bg-adventure-teal/20 text-adventure-teal"
                      : "bg-adventure-gold/20 text-adventure-gold"
                  }`}
                  >
                    {d.isRecommended ? "✓ 推荐" : "○ 其他"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PlaceholderCard({ label }: { label: string }) {
  return (
    <div className="card-adventure !p-0 overflow-hidden border-2 border-dashed border-gray-200">
      <div className="bg-gradient-to-r from-gray-300 to-gray-400 px-5 py-3 text-white">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg flex items-center gap-2">
            {label}
            <span className="bg-white/25 px-2 py-0.5 rounded-full text-xs">
              🔒
            </span>
          </h3>
          <span className="text-xs font-body opacity-80">待解锁</span>
        </div>
      </div>
      <div className="p-5 flex flex-col items-center justify-center min-h-[320px] text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Lock size={32} className="text-gray-400" />
        </div>
        <p className="font-display text-gray-500 mb-2">
          完成第二次冒险后解锁对比
        </p>
        <p className="font-body text-xs text-gray-400 mb-4">
          再次游玩此情景，尝试不同的选择路径，即可在此处查看两次冒险的对比
        </p>
        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="h-3 bg-gray-100 rounded-full" />
          <div className="h-3 bg-gray-100 rounded-full" />
        </div>
        <div className="h-3 bg-gray-100 rounded-full w-1/2 mt-3" />
      </div>
    </div>
  )
}

export default function TheaterReview() {
  const { scenarioId } = useParams<{ scenarioId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as ReviewLocationState | null
  const choices = state?.choices ?? []
  const previousResultFromState = state?.previousResult ?? null
  const isProgress = state?.isProgress ?? false
  const getResultsForScenario = useGameStore((s) => s.getResultsForScenario)

  const scenario = scenarios.find((s) => s.id === scenarioId)

  const { firstResult, secondResult } = useMemo(() => {
    if (!scenarioId) return { firstResult: null, secondResult: null }
    const allResults = getResultsForScenario(scenarioId)
    const sorted = [...allResults].sort(
      (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    )
    return {
      firstResult: sorted.length >= 1 ? sorted[0] : null,
      secondResult: sorted.length >= 2 ? sorted[sorted.length - 1] : null,
    }
  }, [scenarioId, getResultsForScenario])

  if (!scenario) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-adventure-cream">
        <p className="font-body text-adventure-blue/60">情景不存在</p>
      </div>
    )
  }

  const hasTwoResults = firstResult !== null && secondResult !== null
  const isCurrentResultSecond = useMemo(() => {
    if (!secondResult || choices.length === 0) return false
    const lastChoiceId = choices[choices.length - 1]?.optionId
    const secondLastChoiceId =
      secondResult.choices[secondResult.choices.length - 1]?.optionId
    return lastChoiceId === secondLastChoiceId
  }, [secondResult, choices])

  const currentStats = useMemo(() => {
    if (secondResult && isCurrentResultSecond) {
      return {
        recommendedCount: secondResult.recommendedCount,
        totalChoices: secondResult.totalChoices,
        recommendedRatio: secondResult.recommendedRatio,
        starRating: secondResult.starRating,
      }
    }
    return getStatsForChoices(scenario.id, choices)
  }, [secondResult, isCurrentResultSecond, scenario.id, choices])

  const firstStats = useMemo(() => {
    if (firstResult) {
      return {
        recommendedCount: firstResult.recommendedCount,
        totalChoices: firstResult.totalChoices,
        recommendedRatio: firstResult.recommendedRatio,
        starRating: firstResult.starRating,
        playIndex: firstResult.playIndex,
      }
    }
    return null
  }, [firstResult])

  const secondStats = useMemo(() => {
    if (secondResult) {
      return {
        recommendedCount: secondResult.recommendedCount,
        totalChoices: secondResult.totalChoices,
        recommendedRatio: secondResult.recommendedRatio,
        starRating: secondResult.starRating,
        playIndex: secondResult.playIndex,
      }
    }
    return null
  }, [secondResult])

  const currentDetails = useMemo(() => {
    if (secondResult && isCurrentResultSecond) {
      return buildChoiceDetails(scenario.id, secondResult.choices)
    }
    return buildChoiceDetails(scenario.id, choices)
  }, [secondResult, isCurrentResultSecond, scenario.id, choices])

  const firstDetails = useMemo(() => {
    if (firstResult) {
      return buildChoiceDetails(scenario.id, firstResult.choices)
    }
    return []
  }, [firstResult, scenario.id])

  const secondDetails = useMemo(() => {
    if (secondResult) {
      return buildChoiceDetails(scenario.id, secondResult.choices)
    }
    return []
  }, [secondResult, scenario.id])

  const ratioDiff = hasTwoResults && firstStats && secondStats
    ? secondStats.recommendedRatio - firstStats.recommendedRatio
    : 0
  const starsDiff = hasTwoResults && firstStats && secondStats
    ? secondStats.starRating - firstStats.starRating
    : 0

  const keyBranchingScenes = useMemo(() => {
    if (!hasTwoResults) return []
    const set = new Map<string, { first: ScenarioChoiceDetail; second: ScenarioChoiceDetail }>()
    firstDetails.forEach((d) => {
      set.set(d.sceneId, { first: d, second: {} as ScenarioChoiceDetail })
    })
    secondDetails.forEach((d) => {
      const existing = set.get(d.sceneId)
      if (existing) {
        existing.second = d
      } else {
        set.set(d.sceneId, { first: {} as ScenarioChoiceDetail, second: d })
      }
    })
    const different: {
      sceneId: string
      first?: ScenarioChoiceDetail
      second?: ScenarioChoiceDetail
      changed: boolean
    }[] = []
    set.forEach((value, key) => {
      const changed = value.first?.optionId !== value.second?.optionId
      if (changed) {
        different.push({
          sceneId: key,
          first: value.first,
          second: value.second,
          changed: true,
        })
      }
    })
    return different.slice(0, 3)
  }, [hasTwoResults, firstDetails, secondDetails])

  const recommendedOptions = useMemo(() => {
    const opts: string[] = []
    currentDetails.forEach((d) => {
      if (d.isRecommended) opts.push(d.feedback)
    })
    return opts
  }, [currentDetails])

  const tips = tipsMap[scenario.theme] ?? ""

  return (
    <div className="min-h-screen bg-adventure-cream px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="section-title mb-1 text-2xl">
            {scenario.title}
          </h1>
          <p className="font-body text-adventure-blue/60">
            {hasTwoResults ? "双周目对比回顾" : "情景回顾"}
          </p>
          {hasTwoResults && isProgress && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-adventure-gold to-adventure-orange px-4 py-2 text-white shadow-lg"
            >
              <Sparkles size={16} className="animate-wiggle" />
              <span className="font-display">进步了 {Math.round(ratioDiff * 100)}%！继续保持！</span>
              <ArrowUp size={16} />
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          {hasTwoResults && firstStats && secondStats ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ResultCard
                title="📖 一周目冒险"
                result={firstStats}
                details={firstDetails}
                variant="first"
                showBadge={firstStats.playIndex === 1 ? "首次" : undefined}
              />
              <ResultCard
                title="🔄 二周目冒险"
                result={secondStats}
                details={secondDetails}
                variant="second"
                showBadge={
                  ratioDiff > 0
                    ? `↑${Math.round(ratioDiff * 100)}%进步`
                    : ratioDiff < 0
                      ? `↓${Math.round(Math.abs(ratioDiff) * 100)}%`
                      : "持平"
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ResultCard
                title="📖 本次冒险"
                result={{
                  recommendedCount: currentStats.recommendedCount,
                  totalChoices: currentStats.totalChoices,
                  recommendedRatio: currentStats.recommendedRatio,
                  starRating: currentStats.starRating,
                }}
                details={currentDetails}
                variant="single"
              />
              <PlaceholderCard label="🔄 二周目对比" />
            </div>
          )}
        </motion.div>

        {hasTwoResults && keyBranchingScenes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-adventure mb-6"
          >
            <h2 className="mb-4 font-display text-lg text-adventure-blue flex items-center gap-2">
              🔀 关键分支差异
            </h2>
            <div className="space-y-4">
              {keyBranchingScenes.map((scene, idx) => (
                <div
                  key={scene.sceneId}
                  className="rounded-xl border border-adventure-purple/30 bg-adventure-purple/5 p-4"
                >
                  <p className="font-display text-sm text-adventure-purple mb-3">
                    分支 {idx + 1}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white/70 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="rounded-full bg-adventure-blue/20 text-adventure-blue text-[10px] px-2 py-0.5">
                          一周目
                        </span>
                        {scene.first?.isRecommended ? (
                          <span className="text-[10px] text-adventure-teal">
                            ✓ 推荐
                          </span>
                        ) : (
                          <span className="text-[10px] text-adventure-gold">
                            ○ 其他
                          </span>
                        )}
                      </div>
                      <p className="font-body text-xs text-adventure-blue/80 line-clamp-3">
                        {scene.first?.optionText ?? "（未经历此场景）"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/70 p-3 relative">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="rounded-full bg-adventure-orange/20 text-adventure-orange text-[10px] px-2 py-0.5">
                          二周目
                        </span>
                        {scene.second?.isRecommended ? (
                          <span className="text-[10px] text-adventure-teal">
                            ✓ 推荐
                          </span>
                        ) : (
                          <span className="text-[10px] text-adventure-gold">
                            ○ 其他
                          </span>
                        )}
                      </div>
                      <p className="font-body text-xs text-adventure-blue/80 line-clamp-3">
                        {scene.second?.optionText ?? "（未经历此场景）"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {hasTwoResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="card-adventure mb-6"
          >
            <h2 className="mb-4 font-display text-lg text-adventure-blue">
              📊 整体评级对比
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-xl bg-adventure-blue/5">
                <p className="text-xs font-body text-adventure-blue/60 mb-2">
                  推荐率变化
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-display text-xl text-adventure-blue">
                    {firstStats
                      ? `${Math.round(firstStats.recommendedRatio * 100)}%`
                      : "-"}
                  </span>
                  <ArrowRight
                    size={16}
                    className={
                      ratioDiff >= 0
                        ? "text-adventure-teal"
                        : "text-adventure-gold"
                    }
                  />
                  <span className="font-display text-xl text-adventure-orange">
                    {secondStats
                      ? `${Math.round(secondStats.recommendedRatio * 100)}%`
                      : "-"}
                  </span>
                </div>
                <p
                  className={`text-xs font-display mt-1 ${
                    ratioDiff > 0
                      ? "text-adventure-teal"
                      : ratioDiff < 0
                        ? "text-adventure-gold"
                        : "text-adventure-blue/50"
                  }`}
                >
                  {ratioDiff > 0
                    ? `↑ ${Math.round(ratioDiff * 100)}%`
                    : ratioDiff < 0
                      ? `↓ ${Math.round(Math.abs(ratioDiff) * 100)}%`
                      : "持平"}
                </p>
              </div>
              <div className="text-center p-3 rounded-xl bg-adventure-blue/5">
                <p className="text-xs font-body text-adventure-blue/60 mb-2">
                  星级变化
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-adventure-gold text-lg">
                    {"⭐".repeat(firstStats?.starRating ?? 1)}
                  </span>
                  <ArrowRight
                        size={16}
                        className={
                          starsDiff >= 0
                            ? "text-adventure-teal"
                            : "text-adventure-gold"
                        }
                      />
                  <span className="text-adventure-gold text-lg">
                    {"⭐".repeat(secondStats?.starRating ?? 1)}
                  </span>
                </div>
                <p
                  className={`text-xs font-display mt-1 ${
                    starsDiff > 0
                      ? "text-adventure-teal"
                      : starsDiff < 0
                        ? "text-adventure-gold"
                        : "text-adventure-blue/50"
                  }`}
                >
                  {starsDiff > 0
                    ? `↑ ${starsDiff}星`
                    : starsDiff < 0
                      ? `↓ ${Math.abs(starsDiff)}星`
                      : "持平"}
                </p>
              </div>
              <div className="text-center p-3 rounded-xl bg-adventure-blue/5">
                <p className="text-xs font-body text-adventure-blue/60 mb-2">
                  分支变化
                </p>
                <span className="font-display text-xl text-adventure-purple">
                  {keyBranchingScenes.length}
                </span>
                <p className="text-xs font-display mt-1 text-adventure-purple">
                  处不同
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {recommendedOptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-adventure mb-6"
          >
            <h2 className="mb-4 font-display text-lg text-adventure-blue">
              💡 关键收获
            </h2>
            <ul className="space-y-3">
              {recommendedOptions.map((feedback, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-adventure-teal/30 bg-adventure-teal/5 p-3 font-body text-sm text-adventure-blue"
                >
                  {feedback}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {tips && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card-adventure mb-6"
          >
            <h2 className="mb-4 font-display text-lg text-adventure-blue">
              💬 爸爸小贴士
            </h2>
            <p className="font-body text-sm leading-relaxed text-adventure-blue/70">
              {tips}
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <button
            onClick={() => navigate("/theater")}
            className="btn-ghost flex items-center gap-2"
          >
            <Theater size={16} /> 返回剧场
          </button>
          {!hasTwoResults && (
            <button
              onClick={() => navigate(`/theater/${scenario.id}`)}
              className="btn-adventure flex items-center gap-2 bg-gradient-to-r from-adventure-purple to-adventure-pink text-white border-0"
            >
              <Sparkles size={16} /> 开始二周目试试？
            </button>
          )}
          {hasTwoResults && (
            <button
              onClick={() => navigate(`/theater/${scenario.id}`)}
              className="btn-adventure-sm flex items-center gap-2"
            >
              再玩一次
            </button>
          )}
          <button
            onClick={() => navigate("/home")}
            className="btn-adventure flex items-center gap-2"
          >
            <Home size={16} /> 回到主页
          </button>
        </motion.div>
      </div>
    </div>
  )
}
