"use client";

import { useEffect } from "react";

import { apiBaseURL } from "@/lib/api";

export function useTaskRealtime(onTaskEvent: () => void) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const baseURL = apiBaseURL.startsWith("http")
      ? apiBaseURL
      : `${window.location.origin}${apiBaseURL}`;
    const url = new URL(`${baseURL}/realtime/tasks`);

    url.searchParams.set("token", token);

    const source = new EventSource(url.toString());

    source.addEventListener("tasks", () => {
      onTaskEvent();
    });

    return () => {
      source.close();
    };
  }, [onTaskEvent]);
}
