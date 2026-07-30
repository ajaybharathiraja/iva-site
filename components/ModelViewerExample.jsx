import ModelViewer from './ModelViewer';

const ModelViewerExample = () => {
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem 0' }}>
      <ModelViewer
        url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/ToyCar/glTF-Binary/ToyCar.glb"
        width={400}
        height={400}
        autoRotate={true}
        autoRotateSpeed={0.35}
        environmentPreset="forest"
        showScreenshotButton={true}
      />
    </div>
  );
};

export default ModelViewerExample;
