import type { ContentGraph, GraphLesson, GraphTopic } from "./graph"
import { resolveTopicRef } from "./paths"

/**
 * Home's "where to start" logic from `content/start-routes.json`
 * (ADR-0009#start-routes).
 */

/** A step of a start route, resolved: a topic of the graph, or a free label. */
export type StartStep =
  | { readonly kind: "topic"; readonly topic: GraphTopic }
  | { readonly kind: "label"; readonly label: string }

type Route = ContentGraph["startRoutes"]["routes"][number]

/** A route's steps with topic references resolved (validation guarantees they exist). */
export function startStepsOf(graph: ContentGraph, route: Route): StartStep[] {
  return route.steps.flatMap((step): StartStep[] => {
    if (typeof step !== "string") return [{ kind: "label", label: step.label }]
    const topic = graph.topicByKey.get(resolveTopicRef(step, "").key)
    return topic === undefined ? [] : [{ kind: "topic", topic }]
  })
}

/** The first topic on a route that has a page, the card's "{topic} থেকে শুরু" target. */
export function firstTopicWithPage(
  graph: ContentGraph,
  route: Route
): GraphTopic | undefined {
  for (const step of startStepsOf(graph, route)) {
    if (step.kind === "topic" && step.topic.hasPage) return step.topic
  }
  return undefined
}

/**
 * Where Home's main "শুরু করো" goes: the first published lesson along the
 * routes, in route and step order. Undefined while nothing is published
 * (the button then links to the roadmap).
 */
export function homeStartLesson(graph: ContentGraph): GraphLesson | undefined {
  for (const route of graph.startRoutes.routes) {
    for (const step of startStepsOf(graph, route)) {
      if (step.kind !== "topic") continue
      const lesson = graph.lessonById.get(step.topic.lessonIds[0] ?? "")
      if (lesson !== undefined) return lesson
    }
  }
  return undefined
}
