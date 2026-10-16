import { useState } from 'react'
import { FRAME_COUNT, REGIONS, clampFrame, memberById, regionSpans } from './show.js'
import { readDrop, writeSpanDrag } from './Cast.jsx'

const FRAMES = Array.from({ length: FRAME_COUNT }, (_, index) => index + 1)

function frameFromPointer(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  if (rect.width <= 0) return 1
  const ratio = (event.clientX - rect.left) / rect.width
  return clampFrame(Math.floor(ratio * FRAME_COUNT) + 1)
}

export function Timeline({ show, dragKind, onDragKind, onPlayhead, onDrop }) {
  const playhead = show?.playhead ?? 1
  const disabled = !show
  const [hover, setHover] = useState(null)

  return (
    <section className="panel timeline" aria-label="Timeline">
      <div className="timeline-head">
        <h2>Timeline</h2>
        <div className="transport" role="group" aria-label="Playhead">
          <button
            type="button"
            onClick={() => onPlayhead(playhead - 1)}
            disabled={disabled || playhead <= 1}
            aria-label="Previous frame"
          >
            ◀
          </button>
          <span className="frame-readout">Frame {playhead}</span>
          <button
            type="button"
            onClick={() => onPlayhead(playhead + 1)}
            disabled={disabled || playhead >= FRAME_COUNT}
            aria-label="Next frame"
          >
            ▶
          </button>
        </div>
      </div>
      <div className="score" style={{ '--frames': FRAME_COUNT }}>
        <div className="score-ruler">
          <span className="row-label" />
          {FRAMES.map((frame) => (
            <button
              key={frame}
              type="button"
              className={frame === playhead ? 'ruler-frame current' : 'ruler-frame'}
              onClick={() => onPlayhead(frame)}
              disabled={disabled}
              aria-label={`Go to frame ${frame}`}
              aria-current={frame === playhead ? 'true' : undefined}
            >
              {frame % 5 === 0 || frame === 1 ? frame : ''}
            </button>
          ))}
        </div>
        <div className="score-rows">
          {REGIONS.map((region) => (
            <div key={region} className="score-row">
              <span className="row-label">{region}</span>
              <div
                className="row-cells"
                onDragOver={(event) => {
                  if (!show) return
                  event.preventDefault()
                  const moving = [...event.dataTransfer.types].includes('application/x-score-span')
                  event.dataTransfer.dropEffect = moving || dragKind === 'span' ? 'move' : 'copy'
                  setHover({ region, frame: frameFromPointer(event) })
                }}
                onDragLeave={(event) => {
                  if (event.currentTarget.contains(event.relatedTarget)) return
                  setHover((current) => (current?.region === region ? null : current))
                }}
                onDrop={(event) => {
                  if (!show) return
                  event.preventDefault()
                  const frame = frameFromPointer(event)
                  setHover(null)
                  onDrop(region, frame, readDrop(event))
                }}
              >
                {FRAMES.map((frame) => (
                  <span
                    key={frame}
                    className={hover?.region === region && hover.frame === frame ? 'cell cell-over' : 'cell'}
                    style={{ gridColumn: frame }}
                  />
                ))}
                {show
                  ? regionSpans(show, region).map((span, index, spans) => {
                      const member = memberById(show, span.memberId)
                      if (!member) return null
                      const end = Math.min(FRAME_COUNT + 1, span.start + span.length)
                      // Hold: the member stays on this region until the next span starts.
                      const holdEnd = spans[index + 1]?.start ?? FRAME_COUNT + 1
                      return (
                        <span
                          key={span.id}
                          className={`span span-${member.kind}`}
                          style={{ gridColumn: `${span.start} / ${holdEnd}` }}
                          title={`${member.name} from frame ${span.start}`}
                          draggable
                          onDragStart={(event) => {
                            writeSpanDrag(event.dataTransfer, span.id)
                            onDragKind('span')
                          }}
                          onDragEnd={() => onDragKind(null)}
                        >
                          <span
                            className="span-bar"
                            style={{
                              width: `calc(${((end - span.start) / (holdEnd - span.start)) * 100}% - 2px)`,
                              background: member.kind === 'color' ? member.value : undefined,
                            }}
                          />
                          <span className="span-name">{member.name}</span>
                        </span>
                      )
                    })
                  : null}
              </div>
            </div>
          ))}
          <span className="playhead" style={{ '--frame': playhead }} aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
