import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { scenarios } from "@/data/scenarios"
import { useGameStore } from "@/store/useGameStore"
import DifficultyBadge from "@/components/DifficultyBadge"

const tabs = ["全部", "生理成长", "安全守护", "情感成长", "情感引导", "学习成长"]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function Theater() {
  const [activeTab, setActiveTab] = useState("全部")
  const navigate = useNavigate()
  const userProfile = useGameStore((s) => s.userProfile)
  const getResultsForScenario = useGameStore((s) => s.getResultsForScenario)

  const filtered =
    activeTab === "全部"
      ? scenarios
      : scenarios.filter((s) => s.theme === activeTab)

  return (
    <div className="min-h-screen bg-adventure-cream px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="section-title mb-2 text-3xl">🎭 情景扮演剧场</h1>
          <p className="font-body text-adventure-blue/60">
            在安全的模拟中，学习面对真实的挑战
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 flex flex-wrap justify-center gap-2"
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-1.5 text-sm font-body transition-all ${
                activeTab === tab
                  ? "bg-adventure-orange text-white shadow-adventure"
                  : "bg-white text-adventure-blue/70 hover:bg-adventure-orange/10"
              }`}
            >
              {tab}
            </button>
          ))}
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {filtered.map((scenario) => {
            const completed = userProfile?.completedScenarios.includes(
              scenario.id
            )
            const playCount = getResultsForScenario(scenario.id).length
            const isReplayable = playCount >= 1
            return (
              <motion.div
                key={scenario.id}
                variants={item}
                onClick={() => navigate(`/theater/${scenario.id}`)}
                className="card-adventure cursor-pointer hover:-translate-y-1 hover:shadow-card-hover relative overflow-hidden"
              >
                {isReplayable && playCount >= 2 && (
                  <div className="absolute top-2 right-2 rounded-full bg-gradient-to-r from-adventure-gold to-adventure-orange px-2 py-0.5 text-xs font-display text-white shadow-md">
                    🔄 多周目探索
                  </div>
                )}
                {isReplayable && playCount === 1 && (
                  <div className="absolute top-2 right-2 rounded-full bg-gradient-to-r from-adventure-teal to-adventure-blue-light px-2 py-0.5 text-xs font-display text-white shadow-md">
                    ⭐ 可二周目
                  </div>
                )}
                <div className="mb-3 text-4xl">{scenario.emoji}</div>
                <h3 className="mb-1 font-display text-lg text-adventure-blue">
                  {scenario.title}
                </h3>
                <p className="mb-4 line-clamp-2 font-body text-sm text-adventure-blue/60">
                  {scenario.description}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-full bg-adventure-pink/20 px-2 py-0.5 text-xs text-adventure-pink">
                    {scenario.ageRange}
                  </span>
                  <DifficultyBadge difficulty={scenario.difficulty} />
                  {completed && (
                    <span className="text-xs text-adventure-teal">✅ 已完成</span>
                  )}
                  {playCount > 1 && (
                    <span className="text-xs text-adventure-orange">🎮 游玩 {playCount} 次</span>
                  )}
                  {isReplayable && playCount === 1 && (
                    <span className="text-xs text-adventure-purple">💡 换个方式试试？</span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}
