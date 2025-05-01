import CometChatBuilderApp from "./CometChatBuilderApp";
import React from "react";
import { BuilderSettingsProvider } from "./context/BuilderSettingsContext";

const App = () => {
   return (
     /* CometChatBuilderApp requires a parent with explicit height & width to render correctly. 
     Adjust the height and width as needed.
     */
    <div style={{ width: "100vw", height: "100vh" }}>
      <BuilderSettingsProvider>
        <CometChatBuilderApp />
      </BuilderSettingsProvider>
      
    </div>
  );
};

export default App;