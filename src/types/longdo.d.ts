declare global {
  interface LongdoLocation {
    lat: number;
    lon: number;
  }

  interface LongdoVisibleControl {
    visible: (visible: boolean) => void;
  }

  interface LongdoMarker {
    location: (location?: LongdoLocation) => LongdoLocation;

    move: (location: LongdoLocation, animate?: boolean) => void;
  }

  interface LongdoMap {
    Overlays: {
      add: (overlay: unknown) => void;
      remove: (overlay: unknown) => void;
      clear: () => void;
    };

    Route: {
      add: (location: LongdoLocation | unknown) => void;
      search: () => void;
      clear: () => void;
    };

    Layers: {
      add: (layer: unknown) => void;
      remove: (layer: unknown) => void;
      clear: () => void;
      insert: (index: number, layer: unknown) => void;
      setBase: (layer: unknown) => void;
    };

    Event: {
      bind: (name: string, callback: () => void) => void;
    };

    Ui: {
      DPad?: LongdoVisibleControl;
      Zoombar?: LongdoVisibleControl;
      Geolocation?: LongdoVisibleControl;
      Terrain?: LongdoVisibleControl;
      Crosshair?: LongdoVisibleControl;
      Scale?: LongdoVisibleControl;
      Fullscreen?: LongdoVisibleControl;
      LayerSelector?: LongdoVisibleControl;
    };

    location: (location?: LongdoLocation, animate?: boolean) => void;

    zoom: (level?: number, animate?: boolean) => number;

    resize: () => void;
  }

  interface Window {
    longdo: {
      Map: new (options: Record<string, unknown>) => LongdoMap;

      Marker: new (
        location: LongdoLocation,
        options?: Record<string, unknown>,
      ) => LongdoMarker;

      Polyline: new (
        locations: LongdoLocation[],
        options?: Record<string, unknown>,
      ) => unknown;

      Layer: new (name: string, options: Record<string, unknown>) => unknown;

      LayerType: {
        WMS: unknown;
        WMTS_REST: unknown;
        TMS: unknown;
        Custom: unknown;
      };

      UiComponent: {
        Full: unknown;
        Mobile: unknown;
        MobileWithFullLayerSelector: unknown;
        None: unknown;
      };

      Layers: {
        NORMAL: unknown;
        GRAY: unknown;
        LIGHT: unknown; // โทนสว่าง ขาว-เทา (ปุ่ม "สว่าง")
        TOPO: unknown;
        TRAFFIC: unknown;
        POI: unknown;
        SATELLITE: unknown;
      };

      Event: {
        bind: (target: unknown, name: string, callback: () => void) => void;
      };

      zoom: {
        base: number;
      };
    };
  }
}

export {};
