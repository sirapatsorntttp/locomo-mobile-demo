// Longdo Map global type declarations — used by operations and routes pages
declare global {
  interface LongdoMarker {
    location: (loc?: { lat: number; lon: number }) => { lat: number; lon: number }
  }
  interface LongdoMap {
    Overlays: { add: (o: unknown) => void; remove: (o: unknown) => void; clear: () => void }
    Layers:   { add: (l: unknown) => void; remove: (l: unknown) => void; setBase: (l: unknown) => void }
    Event:    { bind: (name: string, cb: () => void) => void }
    Ui:       { Fullscreen: { visible: (v: boolean) => void }; LayerSelector: { visible: (v: boolean) => void } }
    location: (loc?: { lat: number; lon: number }, animate?: boolean) => void
    zoom: (level?: number, animate?: boolean) => number
    resize: () => void
  }
  interface Window {
    longdo: {
      Map:      new (opts: Record<string, unknown>) => LongdoMap
      Marker:   new (loc: { lat: number; lon: number }, opts?: Record<string, unknown>) => LongdoMarker
      Polyline: new (locs: Array<{ lat: number; lon: number }>, opts?: Record<string, unknown>) => unknown
      Icon:     new (opts: Record<string, unknown>) => unknown
      Ui:       { DPad: unknown; Zoombar: unknown; Crosshair: unknown; Scale: unknown }
      zoom:     { base: number }
      Event:    { bind: (target: unknown, name: string, cb: () => void) => void }
      Layers:   { NORMAL: unknown; GRAY: unknown; TOPO: unknown; TRAFFIC: unknown; POI: unknown; SATELLITE: unknown }
    }
  }
}

export {}
