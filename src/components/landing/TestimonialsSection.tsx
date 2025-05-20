
import { Card, CardContent } from "@/components/ui/card";

const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "ConnectorAI helped me land interviews at 3 different companies after months of silence. The personalized outreach messages made all the difference.",
      author: "Sarah J., Product Manager",
      image: "https://placehold.co/100x100/9b87f5/white?text=SJ"
    },
    {
      quote: "I used to dread networking, but the AI made it so much easier to craft messages that didn't feel awkward or pushy. Game changer!",
      author: "Michael T., Software Developer",
      image: "https://placehold.co/100x100/9b87f5/white?text=MT"
    },
    {
      quote: "The tracking system is fantastic - I was able to manage dozens of connections without dropping the ball on follow-ups. Highly recommend!",
      author: "Priya N., Marketing Specialist",
      image: "https://placehold.co/100x100/9b87f5/white?text=PN"
    }
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join professionals who are landing interviews and offers faster by networking more effectively with ConnectorAI.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="text-left">
              <CardContent className="pt-6">
                <div className="flex items-start mb-4">
                  <div className="relative mr-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.author} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                      "
                    </div>
                  </div>
                  <p className="font-medium">{testimonial.author}</p>
                </div>
                <p className="text-gray-600 italic">"{testimonial.quote}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
