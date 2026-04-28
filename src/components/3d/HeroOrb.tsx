'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

function OrbMesh() {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock, mouse }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * 0.15 + mouse.y * 0.3
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.2 + mouse.x * 0.3
    }
    if (ringRef.current) {
      ringRef.current.rotation.x = clock.getElapsedTime() * 0.08
      ringRef.current.rotation.z = clock.getElapsedTime() * 0.12 + mouse.x * 0.2
    }
  })

  return (
    <group>
      {/* Main orb */}
      <Sphere ref={meshRef} args={[1.2, 64, 64]}>
        <MeshDistortMaterial
          color="#7c3aed"
          emissive="#4c1d95"
          emissiveIntensity={0.4}
          roughness={0.1}
          metalness={0.6}
          distort={0.4}
          speed={2}
          transparent
          opacity={0.9}
        />
      </Sphere>

      {/* Outer ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.8, 0.015, 16, 120]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.6} />
      </mesh>

      {/* Second ring */}
      <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[2.1, 0.008, 16, 120]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.35} />
      </mesh>

      {/* Ambient light on orb */}
      <pointLight color="#7c3aed" intensity={2} distance={5} />
      <pointLight color="#06b6d4" intensity={1} distance={8} position={[3, 2, 2]} />
    </group>
  )
}

function Particles() {
  const count = 200
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 2.5 + Math.random() * 2
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  }, [])

  const particlesRef = useRef<THREE.Points>(null)

  useFrame(({ clock }) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.05
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial color="#8b5cf6" size={0.025} transparent opacity={0.7} sizeAttenuation />
    </points>
  )
}

export function HeroOrb() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.2} />
        <OrbMesh />
        <Particles />
        <EffectComposer>
          <Bloom intensity={0.8} luminanceThreshold={0.2} luminanceSmoothing={0.9} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
