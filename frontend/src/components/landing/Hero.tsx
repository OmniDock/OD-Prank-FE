

export default function Hero() {

  return (
    <div className="flex flex-col gap-2 justify-center items-center w-full">

      <h1 className="mt-2 text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
        <span className="bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
          Wen verarschst du heute? 
        </span>
      </h1>

      <p className="text-2xl text-gray-500">
        Beschreibe dein Prank-Szenario und lass unsere KI den perfekten Anruf für dich machen.
      </p>

    </div>
  );
}


