import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  // Color scheme for white background
  const colorScheme = {
    background: "#ffffff",
    textPrimary: "#1a365d", // Dark blue for text
    textSecondary: "#2c5282", // Medium blue for secondary text
    buttonGradientFrom: "#3182ce",
    buttonGradientTo: "#2b6cb0",
  };
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const navigate = useNavigate();
  const handleLoginClick = () => {
    navigate("/login"); // Navigate to the Login page
  };

  useEffect(() => {
    // Set up Three.js
    const canvas = canvasRef.current;

    // Create animated title floating effect
    const animateTitle = () => {
      const titleElement = document.querySelector(".dk-pharma-title");
      if (titleElement) {
        const chars = titleElement.querySelectorAll(".float-char");

        chars.forEach((char, i) => {
          const time = Date.now() * 0.001;
          const offset = Math.sin(time * 1.5 + i * 0.5) * 8;
          const rotate = Math.sin(time * 0.7 + i * 0.2) * 2;

          char.style.transform = `translateY(${offset}px) rotate(${rotate}deg)`;
          char.style.transition = "none"; // Ensure smooth animation
        });

        // Add overall floating to title container
        const time = Date.now() * 0.001;
        const offsetX = Math.sin(time * 0.8) * 10;
        const offsetY = Math.cos(time * 0.5) * 5;
        titleElement.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      }

      requestAnimationFrame(animateTitle);
    };

    // Start title animation
    animateTitle();

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.z = 1.5;
    scene.add(camera);

    // Create flag geometry - increased segments for smoother waves
    const flagGeometry = new THREE.PlaneGeometry(1, 0.6, 64, 64);

    // Create flag material with shaders
    const flagMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        varying float vElevation;

        void main() {
          vUv = uv;

          // Create more complex wave effect
          vec3 pos = position;
          
          // Primary wave
          float waveX1 = sin(pos.x * 10.0 + time * 1.2) * 0.05;
          float waveY1 = sin(pos.y * 8.0 + time * 0.8) * 0.03;
          
          // Secondary wave for more complexity
          float waveX2 = sin(pos.x * 15.0 - time * 0.7) * 0.025;
          float waveY2 = sin(pos.y * 12.0 + time * 1.1) * 0.02;
          
          // Edge effect - make edges wave more
          float edgeEffect = (1.0 - smoothstep(0.0, 0.2, abs(pos.x - 0.5))) * 0.02;
          
          // Combine waves
          float elevation = waveX1 + waveY1 + waveX2 + waveY2 + edgeEffect;
          pos.z += elevation;
          
          vElevation = elevation * 10.0; // Pass to fragment shader for coloring
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        varying float vElevation;

        void main() {
          // Create a nice gradient with lighter colors for white background
          vec3 colorA = vec3(0.6, 0.8, 1.0); // Light blue
          vec3 colorB = vec3(0.8, 0.9, 1.0); // Very light blue
          vec3 colorC = vec3(0.5, 0.7, 0.9); // Medium light blue

          // Add multiple wave patterns to the color
          float pattern1 = sin(vUv.x * 12.0 + vUv.y * 10.0 + time * 0.5) * 0.5 + 0.5;
          float pattern2 = sin(vUv.x * 8.0 - vUv.y * 15.0 - time * 0.7) * 0.5 + 0.5;
          
          // Mix the colors based on patterns and elevation
          vec3 mixColor1 = mix(colorA, colorB, pattern1);
          vec3 mixColor2 = mix(mixColor1, colorC, pattern2);
          vec3 finalColor = mix(mixColor2, vec3(0.2, 0.5, 1.0), vElevation * 0.5);

          // Add dynamic shine effect based on elevation and time
          float shine = pow(sin(vUv.x * 6.28 + time) * 0.5 + 0.5, 8.0);
          finalColor += vec3(shine) * 0.2;
          
          // Add subtle highlight at the wave peaks
          finalColor += vec3(0.1, 0.2, 0.3) * smoothstep(0.0, 0.5, vElevation);

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      uniforms: {
        time: { value: 0 },
      },
      side: THREE.DoubleSide,
    });

    // Create flag mesh
    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    scene.add(flag);

    // Create a floating content panel
    const panelGeometry = new THREE.PlaneGeometry(1.2, 0.8, 32, 32);
    const panelMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        varying float vWave;

        void main() {
          vUv = uv;
          
          // Create softer wave effect for the panel
          vec3 pos = position;
          float waveX = sin(pos.x * 5.0 + time * 0.8) * 0.03;
          float waveY = sin(pos.y * 4.0 + time * 0.6) * 0.02;
          
          // Make the center more stable than the edges
          float distanceFromCenter = length(pos.xy);
          float stabilityFactor = smoothstep(0.0, 0.5, distanceFromCenter);
          
          pos.z += (waveX + waveY) * stabilityFactor;
          vWave = (waveX + waveY) * 10.0;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        varying float vWave;
        
        void main() {
          // Semi-transparent panel with wave-influenced opacity
          float alpha = 0.5 + vWave * 0.2;
          
          // Create a subtle gradient with lighter colors
          vec3 baseColor = vec3(0.9, 0.95, 1.0);
          float gradient = smoothstep(0.2, 0.8, vUv.y);
          vec3 gradientColor = mix(baseColor, vec3(0.8, 0.9, 1.0), gradient);
          
          // Add soft glow around edges
          float edge = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x) * 
                       smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
          gradientColor += vec3(0.05, 0.1, 0.15) * (1.0 - edge);
          
          gl_FragColor = vec4(gradientColor, alpha);
        }
      `,
      uniforms: {
        time: { value: 0 },
      },
      transparent: true,
      side: THREE.DoubleSide,
    });

    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.z = 0.1; // Position in front of the flag
    scene.add(panel);

    // Animation
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Update uniforms
      flagMaterial.uniforms.time.value = elapsedTime;
      panelMaterial.uniforms.time.value = elapsedTime;

      // Make the flag and panel float slightly
      flag.position.y = Math.sin(elapsedTime * 0.5) * 0.05;
      panel.position.y = Math.sin(elapsedTime * 0.5) * 0.05;

      // Subtle rotation
      flag.rotation.z = Math.sin(elapsedTime * 0.3) * 0.03;
      panel.rotation.z = Math.sin(elapsedTime * 0.3) * 0.02;

      // Render
      renderer.render(scene, camera);

      // Call animate recursively
      requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      // Update sizes
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Update camera
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      // Update renderer
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);

      // Dispose resources
      flagGeometry.dispose();
      flagMaterial.dispose();
      panelGeometry.dispose();
      panelMaterial.dispose();
      renderer.dispose();

      if (flag) scene.remove(flag);
      if (panel) scene.remove(panel);
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-white">
      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full z-0"
      />

      {/* Content Container - Positioned to overlay on the 3D panel */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10 p-8 rounded-lg w-4/5 max-w-2xl">
        {/* Logo with floating characters */}
        <h1 className="text-5xl font-bold mb-4 text-blue-900 drop-shadow-md dk-pharma-title">
          {/* Split text into individual characters for floating effect */}
          {"DK Pharma".split("").map((char, index) => (
            <span
              key={index}
              className="float-char"
              style={{
                display: "inline-block",
                transition: "transform 0.1s ease-out",
              }}
            >
              {char}
            </span>
          ))}
        </h1>

        {/* Tagline */}
        <p className="text-xl mb-8 text-blue-800">
          Committed to healthcare innovation and excellence
        </p>

        {/* Login Button */}
        <button
          onClick={handleLoginClick}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none py-4 px-8 text-xl rounded-full cursor-pointer transition-all duration-300 ease-in-out shadow-md hover:shadow-lg hover:-translate-y-1 hover:from-blue-600 hover:to-blue-500"
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
