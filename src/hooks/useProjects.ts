import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { CSProject } from '../types/content'

export function useProjects() {
  const [projects, setProjects] = useState<CSProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cs_projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setProjects(data.map(row => ({
        id: row.id,
        name: row.name,
        source: row.source,
        sourceRef: row.source_ref,
        status: row.status,
        createdAt: row.created_at,
      })))
    } else if (error) {
      console.error('Failed to load projects:', error.message)
    }
    setLoading(false)
  }

  const createProject = async (project: Omit<CSProject, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase
      .from('cs_projects')
      .insert({
        name: project.name,
        source: project.source,
        source_ref: project.sourceRef ?? null,
        status: project.status,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create project:', error.message)
      return null
    }

    const newProject: CSProject = {
      id: data.id,
      name: data.name,
      source: data.source,
      sourceRef: data.source_ref,
      status: data.status,
      createdAt: data.created_at,
    }
    setProjects(prev => [newProject, ...prev])
    return newProject
  }

  const archiveProject = async (id: string) => {
    const { error } = await supabase
      .from('cs_projects')
      .update({ status: 'archived' })
      .eq('id', id)

    if (!error) {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, status: 'archived' } : p))
    }
  }

  return { projects, loading, createProject, archiveProject, reload: loadProjects }
}

export function useProject(projectId: string) {
  const [project, setProject] = useState<CSProject | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    supabase
      .from('cs_projects')
      .select('*')
      .eq('id', projectId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setProject({
            id: data.id,
            name: data.name,
            source: data.source,
            sourceRef: data.source_ref,
            status: data.status,
            createdAt: data.created_at,
          })
        }
        setLoading(false)
      })
  }, [projectId])

  return { project, loading }
}