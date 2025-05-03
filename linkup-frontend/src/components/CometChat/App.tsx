import CometChatBuilderApp from "./CometChatBuilderApp";
import React from "react";
import { BuilderSettingsProvider } from "./context/BuilderSettingsContext";

const App = () => {
   return (
     /* CometChatBuilderApp requires a parent with explicit height & width to render correctly */
    <div style={{ width: "100%", height: "100%" }} className="flex flex-col">
        <BuilderSettingsProvider>
            <CometChatBuilderApp />
        </BuilderSettingsProvider>
    </div>
   );
};

export default App;