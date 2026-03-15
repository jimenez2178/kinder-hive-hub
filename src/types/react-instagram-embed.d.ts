declare module 'react-instagram-embed' {
    import * as React from 'react';

    export interface InstagramEmbedProps {
        url: string;
        maxWidth?: number;
        hideCaption?: boolean;
        containerTagName?: string;
        protocol?: string;
        injectScript?: boolean;
        onLoading?: () => void;
        onSuccess?: (data: any) => void;
        onAfterRender?: () => void;
        onFailure?: (error: any) => void;
    }

    export default class InstagramEmbed extends React.Component<InstagramEmbedProps> {}
}
