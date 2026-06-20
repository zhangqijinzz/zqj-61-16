import { useState, useMemo, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Sparkles, Star, Trophy, PartyPopper } from "lucide-react"
import { scenarios } from "@/data/scenarios"
import { useGameStore } from "@/store/useGameStore"
import type { Option } from "@/types"

export default function TheaterPlay() {
  const { scenarioId } = useParams<{ scenarioId: string }>()
  const navigate = useNavigate()
  const completeScenario = useGameStore((s) => s.completeScenario)
  const getLastResultForScenario = useGameStore((s) => s.getLastResultForScenario)

  const scenario = scenarios.find((s) => s.id === scenarioId)

  const [currentSceneIndex, setCurrentSceneIndex] = useState(0)
  const [choices, setChoices] = useState<{ sceneId: string; optionId: string }[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [selectedOption, setSelectedOption] = useState<Option | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationData, setCelebrationData] = useState<{
    previousRatio: number
    newRatio: number
    previousStars: number
    newStars: number
  } | null>(null)

  const lastResult = useMemo(() => {
    if (!scenarioId) return null
    return getLastResultForScenario(scenarioId)
  }, [scenarioId, getLastResultForScenario])

  const lastChoiceMap = useMemo(() => {
    const map = new Map<string, string>()
    if (lastResult) {
      lastResult.choices.forEach((c) => {
        map.set(c.sceneId, c.optionId)
      })
    }
    return map
  }, [lastResult])

  const playIndex = lastResult ? lastResult.playIndex + 1 : 1
  const isNewGamePlus = playIndex >= 2

  if (!scenario) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-adventure-cream">
        <p className="font-body text-adventure-blue/60">情景不存在</p>
      </div>
    )
  }

  const currentScene = scenario.scenes[currentSceneIndex]
  const lastSelectedOptionId = lastChoiceMap.get(currentScene.id)

  function handleOptionClick(option: Option) {
    setSelectedOption(option)
    setShowFeedback(true)
    setChoices((prev) => [
      ...prev,
      { sceneId: currentScene.id, optionId: option.id },
    ])
  }

  function handleContinue() {
    if (!selectedOption) return

    if (selectedOption.nextSceneId === null) {
      const allChoices = [
        ...choices,
        { sceneId: currentScene.id, optionId: selectedOption.id },
      ]
      const result = completeScenario(scenario.id, allChoices)

      if (result.isProgress && result.previousResult) {
        setCelebrationData({
          previousRatio: result.previousResult.recommendedRatio,
          newRatio: result.newResult.recommendedRatio,
          previousStars: result.previousResult.starRating,
          newStars: result.newResult.starRating,
        })
        setShowCelebration(true)
      } else {
        navigate(`/theater/${scenario.id}/review`, {
          state: {
            choices: allChoices,
            newResult: result.newResult,
            previousResult: result.previousResult,
            isProgress: result.isProgress,
          },
        })
      }
      return
    }

    const nextIndex = scenario.scenes.findIndex(
      (s) => s.id === selectedOption.nextSceneId
    )
    if (nextIndex !== -1) {
      setShowFeedback(false)
      setSelectedOption(null)
      setCurrentSceneIndex(nextIndex)
    }
  }

  function handleCelebrationClose() {
    const allChoices = selectedOption
      ? [...choices, { sceneId: currentScene.id, optionId: selectedOption.id }]
      : choices
    setShowCelebration(false)
    navigate(`/theater/${scenario.id}/review`, {
      state: {
        choices: allChoices,
        isProgress: true,
        celebrationData,
      },
    })
  }

  useEffect(() => {
    if (showCelebration) {
      const timer = setTimeout(() => {
        handleCelebrationClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showCelebration])

  return (
    <div className="min-h-screen bg-adventure-cream px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="section-title text-xl">{scenario.title}</h1>
            {isNewGamePlus && (
              <span className="rounded-full bg-gradient-to-r from-adventure-purple to-adventure-pink px-3 py-1 text-xs font-display text-white shadow-md animate-pulse-glow">
                🔄 第{playIndex}周目探索
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            {scenario.scenes.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-all ${
                  i <= currentSceneIndex
                    ? "bg-adventure-orange"
                    : "bg-adventure-blue/20"
                }`}
              />
            ))}
          </div>
          {isNewGamePlus && (
            <p className="mt-3 text-sm font-body text-adventure-purple flex items-center gap-1">
              <Sparkles size={14} />
              提示：标记的选项是你上次的选择，试试不同的分支吧！
            </p>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentScene.id}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6 rounded-adventure-lg border-l-4 border-adventure-orange bg-white/80 p-6 backdrop-blur">
              <span className="mb-2 inline-block rounded-full bg-adventure-pink/20 px-3 py-0.5 text-xs font-body text-adventure-pink">
                {currentScene.backgroundEmotion}
              </span>
              <p className="font-body leading-relaxed text-adventure-blue">
                {currentScene.narration}
              </p>
            </div>

            {!showFeedback && (
              <div className="space-y-3">
                {currentScene.options.map((option) => {
                  const isLastChoice = lastSelectedOptionId === option.id
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionClick(option)}
                      className={`w-full rounded-xl border-2 p-4 text-left font-body transition-all relative hover:border-adventure-orange ${
                        isLastChoice
                          ? "border-adventure-purple/60 bg-adventure-purple/5"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">{option.text}</div>
                        {isLastChoice && (
                          <span className="shrink-0 rounded-full bg-adventure-purple px-2 py-0.5 text-xs font-display text-white shadow-sm whitespace-nowrap">
                            ⏪ 上次选了此项
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {showFeedback && selectedOption && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="mb-4 rounded-xl border-2 border-adventure-orange bg-adventure-orange/5 p-4 font-body text-adventure-blue">
                  {selectedOption.text}
                </div>

                <div
                  className={`mb-4 rounded-xl border p-4 font-body ${
                    selectedOption.isRecommended
                      ? "border-adventure-teal bg-adventure-teal/10"
                      : "border-adventure-gold bg-adventure-gold/10"
                  }`}
                >
                  <p className="mb-1 text-sm font-display">
                    {selectedOption.isRecommended
                      ? "🌟 推荐做法"
                      : "⚠️ 可以改进"}
                  </p>
                  <p className="mb-2 text-sm text-adventure-blue/70">
                    {selectedOption.consequence}
                  </p>
                  <p className="text-sm text-adventure-blue">
                    {selectedOption.feedback}
                  </p>
                </div>

                <button
                  onClick={handleContinue}
                  className="btn-adventure flex items-center gap-2"
                >
                  继续 <ArrowRight size={16} />
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showCelebration && celebrationData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={handleCelebrationClose}
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 20 }}
              transition={{ type: "spring", duration: 0.6, bounce: 0.4 }}
              className="relative w-full max-w-md rounded-adventure-lg bg-gradient-to-br from-adventure-gold via-adventure-orange-light to-adventure-orange p-8 text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="absolute -top-10 left-1/2 -translate-x-1/2"
              >
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-lg animate-bounce-slow">
                  <Trophy size={40} className="text-adventure-gold" />
                </div>
              </motion.div>

              <div className="pt-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-4"
                >
                  <h2 className="font-display text-3xl text-white drop-shadow-md mb-2 flex items-center justify-center gap-2">
                    <PartyPopper className="animate-wiggle" />
                    进步之星！
                    <PartyPopper className="animate-wiggle" />
                  </h2>
                  <p className="font-body text-white/90 text-lg">
                    你的推荐选择率提升了！
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/20 backdrop-blur rounded-2xl p-4 mb-6"
                >
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-white/80 text-xs font-body mb-1">上次</p>
                      <p className="text-white font-display text-2xl">
                        {Math.round(celebrationData.previousRatio * 100)}%
                      </p>
                      <div className="text-adventure-gold text-sm">
                        {"⭐".repeat(celebrationData.previousStars)}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-white/80 text-xs font-body mb-1">本次</p>
                      <p className="text-white font-display text-2xl">
                        {Math.round(celebrationData.newRatio * 100)}%
                      </p>
                      <div className="text-adventure-gold text-sm">
                        {"⭐".repeat(celebrationData.newStars)}
                      </div>
                    </div>
                  </div>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="h-3 bg-white/30 rounded-full overflow-hidden"
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.round(
                          (celebrationData.newRatio - celebrationData.previousRatio) * 100 * 5
                        )}%`,
                      }}
                      transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-adventure-teal to-white rounded-full flex items-center justify-end pr-1"
                    >
                      <Sparkles size={12} className="text-adventure-orange" />
                    </motion.div>
                  </motion.div>
                  <p className="text-white text-sm font-body mt-2 flex items-center justify-center gap-1">
                    <Star size={14} className="fill-white text-white" />
                    进步了{" "}
                    {Math.round(
                      (celebrationData.newRatio - celebrationData.previousRatio) * 100
                    )}
                    %！继续加油！
                  </p>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  onClick={handleCelebrationClose}
                  className="bg-white text-adventure-orange font-display text-lg px-8 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  查看回顾 →
                </motion.button>

                <p className="mt-4 text-white/70 text-xs font-body">
                  点击任意位置继续
                </p>
              </div>

              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: 0,
                    y: 0,
                    opacity: 1,
                    scale: 1,
                  }}
                  animate={{
                    x: (Math.random() - 0.5) * 300,
                    y: (Math.random() - 0.5) * 300 - 100,
                    opacity: 0,
                    scale: 0.5,
                    rotate: Math.random() * 360,
                  }}
                  transition={{
                    duration: 2,
                    delay: 0.3 + Math.random() * 0.5,
                    ease: "easeOut",
                  }}
                  className="absolute w-3 h-3 rounded-full bg-white pointer-events-none"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${40 + Math.random() * 40}%`,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
