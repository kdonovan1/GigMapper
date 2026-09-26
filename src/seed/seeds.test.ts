import { describe, expect, it } from 'vitest'
import { yamahaMG16XU } from '../data/mixerDefinitions'
import type { StageElement, StagePlotProject } from '../types'
import { validateProject } from '../utils/mixerValidation'
import { porchfestProject } from './porchfest'
import { tapHouse66Project } from './tapHouse66'

/** xFt/yFt are the element's CENTER — see StageElementShape.tsx. */
function bounds(el: StageElement) {
  return {
    left: el.xFt - el.widthFt / 2,
    right: el.xFt + el.widthFt / 2,
    top: el.yFt - el.depthFt / 2,
    bottom: el.yFt + el.depthFt / 2,
  }
}

function overlaps(a: StageElement, b: StageElement): boolean {
  const A = bounds(a)
  const B = bounds(b)
  return A.left < B.right && A.right > B.left && A.top < B.bottom && A.bottom > B.top
}

function assertNoOverlapsAndInBounds(project: StagePlotProject) {
  for (const el of project.elements) {
    const b = bounds(el)
    expect(b.left, `${el.label} (${el.id}) left edge off the layout`).toBeGreaterThanOrEqual(0)
    expect(b.top, `${el.label} (${el.id}) top edge off the layout`).toBeGreaterThanOrEqual(0)
    expect(b.right, `${el.label} (${el.id}) right edge off the layout`).toBeLessThanOrEqual(project.stageWidthFt)
    expect(b.bottom, `${el.label} (${el.id}) bottom edge off the layout`).toBeLessThanOrEqual(project.stageDepthFt)
  }
  for (let i = 0; i < project.elements.length; i++) {
    for (let j = i + 1; j < project.elements.length; j++) {
      const a = project.elements[i]
      const b = project.elements[j]
      expect(overlaps(a, b), `${a.label} overlaps ${b.label}`).toBe(false)
    }
  }
}

describe('Porchfest seed', () => {
  it('marks the lead guitarist tentative with a note that he bailed', () => {
    const el = porchfestProject.elements.find((e) => e.label === 'Lead Guitar')
    expect(el?.status).toBe('tentative')
    expect(el?.notes).toMatch(/bailed/i)
  })

  it('notes the keyboardist is self-contained and not run through the board', () => {
    const el = porchfestProject.elements.find((e) => e.type === 'keyboard')
    expect(el?.notes).toMatch(/self-contained/i)
    expect(porchfestProject.channels.some((c) => c.linkedElementId === el?.id)).toBe(false)
  })

  it('has a monitor wedge marked tentative for not arriving in time', () => {
    const wedges = porchfestProject.elements.filter((e) => e.type === 'monitorWedge')
    expect(wedges).toHaveLength(2)
    expect(wedges.some((w) => w.status === 'tentative' && /didn.t arrive/i.test(w.notes ?? ''))).toBe(true)
  })

  it('validates cleanly against the MG16XU', () => {
    expect(validateProject(porchfestProject, yamahaMG16XU)).toHaveLength(0)
  })

  it('has no overlapping elements and keeps everything within the layout bounds', () => {
    assertNoOverlapsAndInBounds(porchfestProject)
  })
})

describe('Tap House 66 seed', () => {
  it('routes the drummer through her own amp’s XLR line output', () => {
    const channel = tapHouse66Project.channels.find((c) => c.id === 'th-ch-drummer-kit')
    expect(channel?.sourceKind).toBe('lineFromDevice')
    expect(channel?.intermediateDevice).toMatch(/rumble 40/i)
  })

  it('keeps the lead guitarist off the board entirely', () => {
    const el = tapHouse66Project.elements.find((e) => e.label === 'Lead Guitar')
    expect(el?.notes).toMatch(/not on the board/i)
    expect(tapHouse66Project.channels.some((c) => c.linkedElementId === el?.id)).toBe(false)
  })

  it('assigns all four AUX sends, one per monitor wedge', () => {
    expect(tapHouse66Project.auxAssignments).toHaveLength(4)
    const wedges = tapHouse66Project.elements.filter((e) => e.type === 'monitorWedge')
    expect(wedges).toHaveLength(4)
    expect(wedges.every((w) => /fed by aux/i.test(w.notes ?? ''))).toBe(true)
  })

  it('marks the optional bones player tentative', () => {
    const el = tapHouse66Project.elements.find((e) => e.label.startsWith('Bones'))
    expect(el?.status).toBe('tentative')
  })

  it('flags a real mono-capacity warning once the optional bones player is counted', () => {
    // Ch1-8 full, ch9/10 committed to the drummer's stereo line, ch11/12
    // committed to her backup vocal mic — there is truly no mono mic slot
    // left for Bones if he shows, which is exactly what should be flagged.
    const issues = validateProject(tapHouse66Project, yamahaMG16XU)
    expect(issues.some((i) => i.id.includes('capacity-exceeded'))).toBe(true)
  })

  it('has no overlapping elements and keeps everything within the layout bounds', () => {
    assertNoOverlapsAndInBounds(tapHouse66Project)
  })
})
