/**
 * ResourceManager - メモリとリソースの管理を担当
 *
 * 【主な責務】
 * - Three.js オブジェクトのライフサイクル管理
 * - メモリリークの防止
 * - GPU リソースの適切な解放
 * - パフォーマンス最適化
 *
 * 【具体的な処理】
 * 1. BufferGeometry の dispose() 実行
 * 2. ShaderMaterial の dispose() 実行
 * 3. Points オブジェクトのシーンからの削除
 * 4. Float32Array などの参照クリア
 * 5. 不要になったオブジェクトの null 設定
 * 6. メモリ使用量の監視・最適化
 */

import * as THREE from "three";

/**
 * 廃棄可能なオブジェクトの型定義
 */
interface DisposableObject {
  dispose(): void;
}

/**
 * リソース管理用の関数群
 */
export const ResourceManager = {
  /**
   * BufferGeometryの安全な廃棄
   */
  disposeGeometry(geometry: THREE.BufferGeometry | null): void {
    if (!geometry) return;
    
    try {
      // 各属性を個別に廃棄
      Object.keys(geometry.attributes).forEach(key => {
        const attribute = geometry.attributes[key];
        if (attribute && typeof attribute.dispose === 'function') {
          attribute.dispose();
        }
      });
      
      // ジオメトリ本体を廃棄
      geometry.dispose();
    } catch (error) {
      console.warn('Geometry disposal error:', error);
    }
  },

  /**
   * Materialの安全な廃棄
   */
  disposeMaterial(material: THREE.Material | null): void {
    if (!material) return;
    
    try {
      // テクスチャがある場合は廃棄
      if ('map' in material && material.map) {
        material.map.dispose();
      }
      
      // マテリアル本体を廃棄
      material.dispose();
    } catch (error) {
      console.warn('Material disposal error:', error);
    }
  },

  /**
   * Points オブジェクトの安全な廃棄
   */
  disposePoints(points: THREE.Points | null, scene: THREE.Scene): void {
    if (!points) return;
    
    try {
      // シーンから削除
      scene.remove(points);
      
      // ジオメトリとマテリアルを廃棄
      this.disposeGeometry(points.geometry);
      this.disposeMaterial(points.material as THREE.Material);
      
    } catch (error) {
      console.warn('Points disposal error:', error);
    }
  },

  /**
   * 複数のオブジェクトを一括廃棄
   */
  disposeAll(objects: (DisposableObject | null)[]): void {
    objects.forEach(obj => {
      if (obj && typeof obj.dispose === 'function') {
        try {
          obj.dispose();
        } catch (error) {
          console.warn('Object disposal error:', error);
        }
      }
    });
  },

  /**
   * Float32Array などの配列参照をクリア
   */
  clearArrayReferences(arrays: (Float32Array | null)[]): void {
    arrays.forEach((arr, index) => {
      if (arr) {
        // 参照をクリアするために null を設定
        arrays[index] = null;
      }
    });
  },

  /**
   * メモリ使用量の監視（開発用）
   */
  getMemoryUsage(): { used: number; total: number } | null {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100, // MB
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024 * 100) / 100 // MB
      };
    }
    return null;
  },

  /**
   * Three.js renderer の状態確認
   */
  getRendererInfo(renderer: THREE.WebGLRenderer): {
    geometries: number;
    textures: number;
    programs: number;
  } {
    return {
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      programs: renderer.info.programs?.length || 0
    };
  },

  /**
   * 強制的にガベージコレクションを提案（開発用）
   */
  suggestGarbageCollection(): void {
    if (typeof global !== 'undefined' && global.gc) {
      try {
        global.gc();
        console.log('Garbage collection executed');
      } catch (error) {
        console.warn('Garbage collection failed:', error);
      }
    }
  }
} as const;
