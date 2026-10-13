import { FRAME_COUNT, REGIONS, memberById, regionSpans } from './show.js'

const FRAMES = Array.from({ length: FRAME_COUNT }, (_, index) => index + 1)

export function Timeline({ show, onPlayhead }) {
  const playhead = show?.playhead ?? 1
  const disabled = !show

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
              <div className="row-cells">
                {FRAMES.map((frame) => (
                  <span key={frame} className="cell" style={{ gridColumn: frame }} />
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
