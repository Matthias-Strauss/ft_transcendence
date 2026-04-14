import { forwardRef } from "react";

interface BookmarkProps {
    hasPicture?: boolean;
}

export const Bookmarked = forwardRef<HTMLTextAreaElement, BookmarkProps>(
    ({hasPicture}, ref) => {
        {hasPicture && 
        return (
            <div>
                <div>
                    <ul>
                        <li>
                            
                        </li>
                    </ul>
                </div>
            </div>
        )
    }
    }
)