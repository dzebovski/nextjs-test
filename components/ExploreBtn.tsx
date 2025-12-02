"use client";
import Image from "next/image";

const ExploreBtn = () => {
  return (
    <button
      type="button"
      id="explore-btn"
      className="mt-7 mx-auto"
      onClick={() => console.log("Explore clicked")}
    >
      <a href="#events">
        Explore Something
        <Image
          src="/icons/arrow-down.svg"
          alt="Explore something"
          width={20}
          height={20}
        />
      </a>
    </button>
  );
};

export default ExploreBtn;
